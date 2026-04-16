use html5ever::QualName;
use markup5ever::interface::QuirksMode as ServoQuirksMode;
use serde_wasm_bindgen::Serializer;
use serde_wasm_bindgen::Deserializer;
use serde_wasm_bindgen::Error as SerdeError;
use wasm_bindgen::JsValue;

type Result<T = JsValue> = std::result::Result<T, SerdeError>;

/// Converts [`JsValue`] into a Rust type.
pub fn from_value<T: serde::de::DeserializeOwned>(value: JsValue) -> Result<T> {
    T::deserialize(Deserializer::from(value))
}

/// Converts a Rust value into a [`JsValue`].
pub fn to_value<T: serde::ser::Serialize + ?Sized>(value: &T) -> Result<JsValue> {
    value.serialize(&Serializer::json_compatible())
}

use crate::Handle;
use crate::Interner;
use crate::NodeData;
use crate::RcDom;
use crate::WireAttr;
use crate::WireDoc;
use crate::WireNode;
use crate::WireNodeType;

pub fn serialize_dom(dom: RcDom, content_type: &'static str) -> WireDoc {
  let mut interner = Interner::default();

  let mut nodes = Vec::new();
  collect(&dom.document, None, &mut interner, &mut nodes);

  let quirks_mode = match dom.quirks_mode.get() {
    ServoQuirksMode::NoQuirks => "no-quirks",
    ServoQuirksMode::Quirks => "quirks",
    ServoQuirksMode::LimitedQuirks => "limited-quirks",
  }
  .into();

  let strings = interner.into_strings();

  WireDoc(content_type.into(), quirks_mode, strings, nodes)
}

fn collect(
  handle: &Handle,
  parent: Option<u32>,
  interner: &mut Interner,
  nodes: &mut Vec<WireNode>,
) -> u32 {
  let id = nodes.len() as u32;

  macro_rules! intern {
    ($s:expr) => {
      interner.intern($s)
    };
  }

  let node_type: WireNodeType;
  let name: Option<u32>;
  let mut value: Option<u32> = None;
  let mut node_parent = parent;
  let mut attrs: Option<Vec<WireAttr>> = None;

  match &handle.data {
    NodeData::Document => {
      node_type = WireNodeType::Document;
      node_parent = None;
      name = Some(intern!("#document"));
    }
    NodeData::Doctype {
      name: doctype_name,
      public_id,
      system_id,
    } => {
      node_type = WireNodeType::DocumentType;
      name = Some(intern!(doctype_name));
      let val = format!("{doctype_name}");

      let mut attributes = Vec::new();
      attributes.push(WireAttr(None, intern!("name"), intern!(doctype_name)));

      if !public_id.is_empty() {
        // val.push_str(&format!(r#"PUBLIC \"{public_id}\" "#));
        attributes.push(WireAttr(
          None,
          intern!("publicId"),
          intern!(public_id),
        ));
      }

      if !system_id.is_empty() {
        // val.push_str(&format!(r#"SYSTEM \"{system_id}\""#));
        attributes.push(WireAttr(
          None,
          intern!("systemId"),
          intern!(system_id),
        ));
      }

      value = Some(intern!(val.trim().to_string()));
      attrs = Some(attributes);
    }
    NodeData::Text { contents } => {
      node_type = WireNodeType::Text;
      name = Some(intern!("#text"));
      value = Some(intern!(contents.borrow().as_ref()));
    }
    NodeData::Comment { contents } => {
      node_type = WireNodeType::Comment;
      name = Some(intern!("#comment"));
      value = Some(intern!(contents));
    }
    NodeData::ProcessingInstruction { target, contents } => {
      node_type = WireNodeType::ProcessingInstruction;
      name = Some(intern!(target));
      value = Some(intern!(contents));
    }
    NodeData::Element {
      name: qname,
      attrs: element_attrs,
      ..
    } => {
      node_type = WireNodeType::Element;
      name = Some(intern_qual(qname, interner));

      let attributes = element_attrs.borrow();
      if !attributes.is_empty() {
        let mut out = Vec::with_capacity(attributes.len());
        for attr in attributes.iter() {
          let ns = if attr.name.ns.is_empty() {
            None
          } else {
            Some(intern!(attr.name.ns.as_ref()))
          };
          out.push(WireAttr(
            ns,
            intern_qual_local(&attr.name, interner),
            intern!(attr.value.as_ref()),
          ));
        }
        attrs = Some(out);
      }
    }
  }

  nodes.push(WireNode(
    id,
    node_type,
    name,
    value,
    node_parent,
    None, // first child
    None, // next sibling
    attrs,
  ));

  let kids = handle.children.borrow();
  let mut last_id: Option<u32> = None;
  for (index, child) in kids.iter().enumerate() {
    let child_id = collect(child, Some(id), interner, nodes);

    if index == 0 {
      let parent_node = nodes
        .get_mut(id as usize)
        .expect("missing parent node while assigning first child");
      parent_node.5 = Some(child_id);
    } else if let Some(prev) = last_id {
      let prev_node = nodes
        .get_mut(prev as usize)
        .expect("missing previous sibling node");
      prev_node.6 = Some(child_id);
    }

    last_id = Some(child_id);
  }

  id
}

fn intern_qual(q: &QualName, interner: &mut Interner) -> u32 {
  let prefix = q.prefix.as_ref().map(|p| p.as_ref()).unwrap_or("");
  let local = q.local.as_ref();
  let ns = q.ns.as_ref();
  if !ns.is_empty() {
    interner.intern(ns);
  }

  let local_index = interner.intern(local);
  if !prefix.is_empty() {
    interner.intern(format!("{prefix}:{local}"))
  } else {
    local_index
  }
}

fn intern_qual_local(
  q: &markup5ever::QualName,
  interner: &mut Interner,
) -> u32 {
  interner.intern(q.local.as_ref())
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use html5ever::ParseOpts;
  use html5ever::parse_document;
  use html5ever::tendril::TendrilSink;

  use crate::RcDom;

  use super::serialize_dom;

  #[test]
  fn serialize_dom_emits_unique_and_consistent_node_links() {
    let input = "<!doctype html><html><body><p>one</p><p>two</p></body></html>";
    let dom = parse_document(RcDom::default(), ParseOpts::default())
      .from_utf8()
      .read_from(&mut input.as_bytes())
      .expect("failed to parse html fixture");

    let wire = serialize_dom(dom, "text/html");
    let nodes = &wire.3;

    let mut ids = HashSet::with_capacity(nodes.len());
    for node in nodes {
      assert!(ids.insert(node.0), "duplicate wire node id: {}", node.0);
      assert_ne!(node.5, Some(node.0), "node cannot be its own first child");
      assert_ne!(node.6, Some(node.0), "node cannot be its own next sibling");
    }

    for node in nodes {
      for link in [node.4, node.5, node.6].into_iter().flatten() {
        assert!(
          ids.contains(&link),
          "wire link points to missing node id: {}",
          link
        );
      }
    }
  }
}
