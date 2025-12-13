// Copyright 2014-2017 The html5ever Project Developers. See the
// COPYRIGHT file at the top-level directory of this distribution.
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option. This file may not be copied, modified, or distributed
// except according to those terms.

//! A simple reference-counted DOM. This is sufficient as a static parse tree,
//! but don't try to build a web browser using it. :)
//!
//! A DOM is a [tree structure] with ordered children that can be represented in
//! an XML-like format. For example, the following graph:
//!
//! ```text
//! div
//!  +- "text node"
//!  +- span
//! ```
//!
//! ...would be serialized to HTML as:
//!
//! ```html
//! <div>text node<span></span></div>
//! ```
//!
//! See the [document object model article on wikipedia][dom wiki] for more
//! information.
//!
//! This implementation stores the information associated with each node once,
//! and then hands out refs to children. Nodes themselves are ref-counted to
//! avoid copying - you can create a new ref and then a node will outlive the
//! document. Nodes own their children, but only reference their parents with
//! weak pointers to avoid cycles. This allows for efficient traversal of the
//! tree structure in both directions.
//!
//! [tree structure]: https://en.wikipedia.org/wiki/Tree_(data_structure)
//! [dom wiki]: https://en.wikipedia.org/wiki/Document_Object_Model

use alloc::borrow::Cow;
use alloc::collections::BTreeSet;
use alloc::rc::Rc;
use alloc::rc::Weak;
use core::cell::Cell;
use core::cell::RefCell;
use core::default::Default;
use core::fmt;
use core::mem;

use derive_more::with_trait::Debug;
use derive_more::with_trait::*;
use html5ever::Attribute;
use html5ever::QualName;
use html5ever::serialize::Serialize;
use html5ever::serialize::Serializer;
use html5ever::serialize::TraversalScope;
use html5ever::tendril;
use html5ever::tree_builder;
use html5ever::tree_builder::NodeOrText;
use html5ever::tree_builder::QuirksMode;
use html5ever::tree_builder::TreeSink;
use tendril::StrTendril;
use xml5ever::interface::*;

/// The different kinds of nodes in the DOM.
#[derive(Debug)]
pub enum NodeData {
  /// The `Document` itself - the root node of a HTML document.
  Document,

  /// A `DOCTYPE` with name, public id, and system id. See
  /// [document type declaration on wikipedia][dtd wiki].
  ///
  /// [dtd wiki]: https://en.wikipedia.org/wiki/Document_type_declaration
  Doctype {
    name:      StrTendril,
    public_id: StrTendril,
    system_id: StrTendril,
  },

  /// A text node.
  Text { contents: RefCell<StrTendril> },

  /// A comment.
  Comment { contents: StrTendril },

  /// An element with attributes.
  Element {
    name:  QualName,
    attrs: RefCell<Vec<Attribute>>,

    /// For HTML \<template\> elements, the [template contents].
    ///
    /// [template contents]: https://html.spec.whatwg.org/multipage/#template-contents
    template_contents: Option<Handle>,

    /// Whether the node is a [HTML integration point].
    ///
    /// [HTML integration point]: https://html.spec.whatwg.org/multipage/#html-integration-point
    mathml_annotation_xml_integration_point: bool,
  },

  /// A Processing instruction.
  ProcessingInstruction {
    target:   StrTendril,
    contents: StrTendril,
  },
}

/// A DOM node.
pub struct Node {
  /// Parent node.
  pub parent:   Cell<Option<WeakHandle>>,
  /// Child nodes of this node.
  pub children: RefCell<Vec<Handle>>,
  /// Represents this node's data.
  pub data:     NodeData,
}

impl Node {
  /// Create a new node from its contents
  pub fn new(data: NodeData) -> Rc<Self> {
    Rc::new(Node {
      data,
      parent: Cell::new(None),
      children: RefCell::new(vec![]),
    })
  }
}

impl fmt::Debug for Node {
  fn fmt(&self, fmt: &mut fmt::Formatter) -> fmt::Result {
    fmt
      .debug_struct("Node")
      .field("data", &self.data)
      .field("children", &self.children)
      .finish()
  }
}

/// Reference to a DOM node.
pub type Handle = Rc<Node>;

/// Weak reference to a DOM node, used for parent pointers.
pub type WeakHandle = Weak<Node>;

pub trait ParentNode: Debug + Deref<Target = Node> {
  fn get_parent_and_index(&self) -> Option<(Handle, usize)>;
  fn remove_from_parent(&self);
}

pub trait Appendable: ParentNode {
  fn append(&self, child: Handle);
  fn append_to_existing_text(&self, text: &str) -> bool;
}

impl ParentNode for Handle {
  fn get_parent_and_index(&self) -> Option<(Handle, usize)> {
    let weak = self.parent.take()?;
    let parent = weak.upgrade().expect("dangling weak pointer to parent");
    self.parent.set(Some(weak));
    let i = match parent
      .children
      .borrow()
      .iter()
      .enumerate()
      .find(|&(_, child)| Rc::ptr_eq(&child, &self))
    {
      Some((i, _)) => i,
      None => panic!("have parent but couldn't find in parent's children!"),
    };
    Some((parent, i))
  }

  fn remove_from_parent(&self) {
    if let Some((parent, i)) = self.get_parent_and_index() {
      parent.children.borrow_mut().remove(i);
      self.parent.set(None);
    }
  }
}

impl Appendable for Handle {
  fn append(&self, child: Handle) {
    let this = self;
    let val = Some(Rc::downgrade(this));
    let previous_parent = child.parent.replace(val);

    assert!(
      previous_parent.is_none(),
      "child passed to append cannot have existing parent"
    );

    self.children.borrow_mut().push(child);
  }

  fn append_to_existing_text(&self, text: &str) -> bool {
    match self.data {
      NodeData::Text { ref contents } => {
        contents.borrow_mut().push_slice(text);
        true
      }
      _ => false,
    }
  }
}

/// The DOM itself; the result of parsing.
#[derive(Debug, Clone)]
pub struct RcDom {
  /// The `Document` itself.
  pub document: Handle,

  /// Errors that occurred during parsing.
  pub errors: RefCell<Vec<Cow<'static, str>>>,

  /// The document's quirks mode.
  pub quirks_mode: Cell<QuirksMode>,
}

impl TreeSink for RcDom {
  type Output = Self;
  type Handle = Rc<Node>;
  type ElemName<'a>
    = &'a QualName
  where
    Self: 'a;

  fn finish(self) -> Self {
    self
  }

  fn parse_error(&self, msg: Cow<'static, str>) {
    self.errors.borrow_mut().push(msg);
  }

  fn get_document(&self) -> Handle {
    self.document.clone()
  }

  fn get_template_contents(&self, target: &Handle) -> Handle {
    if let NodeData::Element {
      template_contents: Some(ref contents),
      ..
    } = target.data
    {
      contents.clone()
    } else {
      panic!("not a template element!")
    }
  }

  fn set_quirks_mode(&self, mode: QuirksMode) {
    self.quirks_mode.set(mode);
  }

  fn same_node(&self, x: &Handle, y: &Handle) -> bool {
    Rc::ptr_eq(x, y)
  }

  fn elem_name<'a>(&self, target: &'a Handle) -> Self::ElemName<'a> {
    match &target.data {
      NodeData::Element { name, .. } => name,
      _ => panic!("not an element!"),
    }
  }

  fn create_element(
    &self,
    name: QualName,
    attrs: Vec<Attribute>,
    flags: ElementFlags,
  ) -> Handle {
    Node::new(NodeData::Element {
      name,
      attrs: RefCell::new(attrs),
      template_contents: if flags.template {
        Some(Node::new(NodeData::Document))
      } else {
        None
      },
      mathml_annotation_xml_integration_point: flags
        .mathml_annotation_xml_integration_point,
    })
  }

  fn create_comment(&self, contents: StrTendril) -> Handle {
    Node::new(NodeData::Comment { contents })
  }

  fn create_pi(&self, target: StrTendril, contents: StrTendril) -> Handle {
    Node::new(NodeData::ProcessingInstruction { target, contents })
  }

  fn append(&self, parent: &Handle, child: NodeOrText<Handle>) {
    // Append to an existing Text node if we have one.
    if let NodeOrText::AppendText(ref text) = child {
      if let Some(h) = parent.children.borrow().last() {
        if h.append_to_existing_text(&text) {
          return;
        }
      }
    }

    parent.append(match child {
      NodeOrText::AppendText(text) => Node::new(NodeData::Text {
        contents: RefCell::new(text),
      }),
      NodeOrText::AppendNode(node) => node,
    });
  }

  fn append_before_sibling(&self, sibling: &Handle, child: NodeOrText<Handle>) {
    let (parent, i) = sibling
      .get_parent_and_index()
      .expect("append_before_sibling called on node without parent");

    let child = match (child, i) {
      // No previous node.
      (NodeOrText::AppendText(text), 0) => Node::new(NodeData::Text {
        contents: RefCell::new(text),
      }),

      // Look for a text node before the insertion point.
      (NodeOrText::AppendText(text), i) => {
        let children = parent.children.borrow();
        let prev = &children[i - 1];
        if prev.append_to_existing_text(&text) {
          return;
        }
        Node::new(NodeData::Text {
          contents: RefCell::new(text),
        })
      }

      // The tree builder promises we won't have a text node after
      // the insertion point.

      // Any other kind of node.
      (NodeOrText::AppendNode(node), _) => node,
    };

    child.remove_from_parent();

    child.parent.set(Some(Rc::downgrade(&parent)));
    parent.children.borrow_mut().insert(i, child);
  }

  fn append_based_on_parent_node(
    &self,
    element: &Self::Handle,
    prev_element: &Self::Handle,
    child: NodeOrText<Self::Handle>,
  ) {
    let el: &Handle = element;
    let parent = el.parent.take();
    let has_parent = parent.is_some();
    element.parent.set(parent);

    if has_parent {
      self.append_before_sibling(element, child);
    } else {
      self.append(prev_element, child);
    }
  }

  fn append_doctype_to_document(
    &self,
    name: StrTendril,
    public_id: StrTendril,
    system_id: StrTendril,
  ) {
    self.document.append(Node::new(NodeData::Doctype {
      name,
      public_id,
      system_id,
    }));
  }

  fn add_attrs_if_missing(&self, target: &Handle, attrs: Vec<Attribute>) {
    let mut existing = if let NodeData::Element { ref attrs, .. } = target.data
    {
      attrs.borrow_mut()
    } else {
      panic!("not an element")
    };

    let existing_names = existing
      .iter()
      .map(|e| e.name.clone())
      .collect::<BTreeSet<_>>();
    existing.extend(
      attrs
        .into_iter()
        .filter(|attr| !existing_names.contains(&attr.name)),
    );
  }

  fn remove_from_parent(&self, target: &Handle) {
    target.remove_from_parent();
  }

  fn reparent_children(&self, node: &Handle, new_parent: &Handle) {
    let mut children = node.children.borrow_mut();
    let mut new_children = new_parent.children.borrow_mut();
    for child in children.iter() {
      let previous_parent =
        child.parent.replace(Some(Rc::downgrade(&new_parent)));
      assert!(Rc::ptr_eq(
        &node,
        &previous_parent.unwrap().upgrade().expect("dangling weak")
      ))
    }
    new_children.extend(mem::replace(&mut *children, Vec::new()));
  }

  fn is_mathml_annotation_xml_integration_point(
    &self,
    target: &Handle,
  ) -> bool {
    if let NodeData::Element {
      mathml_annotation_xml_integration_point,
      ..
    } = target.data
    {
      mathml_annotation_xml_integration_point
    } else {
      panic!("not an element!")
    }
  }
}

impl Default for RcDom {
  fn default() -> RcDom {
    RcDom {
      document:    Node::new(NodeData::Document),
      errors:      RefCell::new(vec![]),
      quirks_mode: Cell::new(tree_builder::NoQuirks),
    }
  }
}

#[derive(Debug, IsVariant, TryInto, TryFrom)]
#[try_from(repr)]
enum SerializeOp {
  Open(Handle),
  Close(QualName),
}

#[derive(Debug, Clone, Deref, DerefMut, From, AsRef, AsMut)]
pub struct SerializableHandle(Handle);

impl Serialize for SerializableHandle {
  fn serialize<S>(
    &self,
    serializer: &mut S,
    traversal_scope: TraversalScope,
  ) -> std::io::Result<()>
  where
    S: Serializer,
  {
    let mut ops = match traversal_scope {
      TraversalScope::IncludeNode => vec![SerializeOp::Open(self.0.clone())],
      TraversalScope::ChildrenOnly(_) => self
        .0
        .children
        .borrow()
        .iter()
        .rev()
        .map(|h| SerializeOp::Open(h.clone()))
        .collect(),
    };

    while let Some(op) = ops.pop() {
      match op {
        SerializeOp::Open(handle) => match &handle.data {
          NodeData::Element {
            name,
            attrs,
            template_contents,
            ..
          } => {
            serializer.start_elem(
              name.clone(),
              attrs.borrow().iter().map(|at| (&at.name, &at.value[..])),
            )?;

            ops.push(SerializeOp::Close(name.clone()));

            for child in handle.children.borrow().iter().rev() {
              ops.push(SerializeOp::Open(child.clone()));
            }

            if let Some(template_contents) = template_contents {
              for ref mut child in
                template_contents.children.borrow().iter().rev()
              {
                child.parent.replace(Some(Rc::downgrade(&handle)));
                ops.push(SerializeOp::Open(child.clone()));
              }
            }
          }

          NodeData::Doctype { name, .. } => serializer.write_doctype(&name)?,

          NodeData::Text { contents } => {
            serializer.write_text(&contents.borrow())?
          }

          NodeData::Comment { contents } => {
            serializer.write_comment(&contents)?
          }

          NodeData::ProcessingInstruction { target, contents } => {
            serializer.write_processing_instruction(target, contents)?
          }

          NodeData::Document => {
            for child in handle.children.borrow().iter().rev() {
              ops.push(SerializeOp::Open(child.clone()));
            }
          }
        },

        SerializeOp::Close(name) => {
          serializer.end_elem(name)?;
        }
      }
    }

    Ok(())
  }
}
