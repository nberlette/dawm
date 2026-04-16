use derive_more::with_trait::Debug;
use serde::Deserialize;
use serde::Serialize;
use serde_repr::Deserialize_repr;
use serde_repr::Serialize_repr;

use moos::CowStr;

#[derive(
  Serialize_repr,
  Deserialize_repr,
  Debug,
  Clone,
  Copy,
  PartialEq,
  Eq,
  Hash,
  Default,
)]
#[repr(u8)]
pub enum WireNodeType {
  /// Represents an Element node, the fundamental building block of the Document
  /// Object Model (DOM) tree structure used to represent HTML/XML documents in
  /// memory. All elements in the DOM tree are represented as subclasses of the
  /// Element interface, with a node type of 1.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Element
  #[default]
  Element = 1,

  /// Represents an Attribute node, which is used to represent the attributes
  /// of an element in the Document Object Model (DOM) tree structure. Each
  /// attribute of an element is represented as a separate Attribute node, with
  /// a node type of 2.
  ///
  /// For example, in the HTML snippet `<a href="https://dawm.com">dawm</a>`,
  /// the `href` attribute would be represented as an Attribute node with the
  /// name `"href"` and the value `"https://dawm.com"`.
  ///
  /// Attribute nodes are not part of the main DOM tree, however, and cannot be
  /// accessed directly through the typical parent-child relationships of the
  /// DOM. Instead, they are accessed through the `attributes` property of an
  /// Element node, which returns a NamedNodeMap containing all the attributes
  /// of that element.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Attribute
  Attribute = 2,
  /// Represents a Text node, which contains the actual text data within
  /// an HTML/XML document.
  ///
  /// For example, in the HTML snippet `<p>Hello, world!</p>`,
  /// the text "Hello, world!" would be represented as a Text node that is a
  /// child of the `<p>` element, with a node type of 3.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Text
  Text = 3,
  /// Represents a CDATASection node, which is used to represent a CDATA
  /// section in an XML document. CDATA sections are used to include text data
  /// that should not be parsed by the XML parser, such as special characters
  /// or reserved words.
  ///
  /// A CDATA section is defined using the `<![CDATA[` and `]]>` delimiters,
  /// and any text contained within these delimiters is treated as character
  /// data rather than markup.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/CDATASection
  #[serde(rename = "CDATASection")]
  CData = 4,
  /// @deprecated The EntityReference interface is deprecated and should not be used in new
  /// projects. Although it may still be supported by _some_ browsers, it is not
  /// guaranteed to work across all major browsers and may be removed in the future.
  /// In the context of the dawm project, there is no support for EntityReference nodes.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/EntityReference
  EntityReference = 5,
  /// @deprecated The Entity interface is deprecated and should not be used in
  /// new projects. Although it may still be supported by _some_ browsers, it
  /// is not guaranteed to work across all major browsers and may be removed in
  /// the future. In the context of the dawm project, there is no support for
  /// Entity nodes.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Entity
  Entity = 6,
  /// Represents a ProcessingInstruction node, which is used to represent a
  /// processing instruction in an XML document. Processing instructions are
  /// used to provide instructions to the XML parser or to applications that
  /// process the XML document. They are defined using the `<?` and `?>`
  /// delimiters, and can contain any text data that is relevant to the
  /// processing of the XML document.
  ///
  /// For example, in an XML document, there is often an XML declaration tag
  /// with a version number and encoding information, along the lines of
  /// `<?xml version="1.0" encoding="UTF-8"?>`. This XML declaration would be
  /// represented as a ProcessingInstruction node.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/ProcessingInstruction
  ProcessingInstruction = 7,
  /// Represents a Comment node, which is used to represent comments in an
  /// HTML/XML document. Comments are used to include notes or explanations
  /// within the source code of a document, and are not rendered or processed
  /// by the browser or XML parser.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Comment
  Comment = 8,
  /// Represents a Document node, which is the root node of the Document Object
  /// Model (DOM) tree structure used to represent HTML/XML documents in
  /// memory.
  ///
  /// The Document node serves as the entry point to the DOM tree and provides
  /// access to all other nodes in the document. It has a node type of 9 and is
  /// typically created when a document is parsed or loaded into memory.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Document
  Document = 9,
  /// Represents a DocumentType node, which is used to represent the document type
  /// declaration in an HTML/XML document, such as `<!DOCTYPE html>`.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentType
  DocumentType = 10,
  /// Represents a DocumentFragment node, which is a lightweight container used
  /// to hold a portion of a document that can be manipulated and inserted into
  /// the main DOM tree, without the overhead of creating a full Document node.
  ///
  /// DocumentFragment nodes are often used to build up a portion of a document
  /// in memory before inserting it into the main DOM tree, as they allow for
  /// efficient manipulation/insertion of multiple nodes at once. ShadowRoot
  /// objects are subclasses of DocumentFragment, and therefore also have the
  /// same node type of 11.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
  DocumentFragment = 11,
  /// @deprecated The Notation interface is deprecated and should not be used in new
  /// projects. Although it may still be supported by _some_ browsers, it is not
  /// guaranteed to work across all major browsers and may be removed in the future.
  ///
  /// In the context of the dawm project, there is no support for Notation nodes.
  ///
  /// @see https://developer.mozilla.org/en-US/docs/Web/API/Notation
  Notation = 12,
}

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
pub struct WireAttr(
  /// optional namespace url index
  pub Option<u32>,
  /// name index
  pub u32,
  /// value index
  pub u32,
);

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, PartialEq, Eq, Hash,
)]
pub struct WireNode(
  /// node index
  pub u32,
  /// node type
  pub WireNodeType,
  /// name index (for Element/PI)
  pub Option<u32>,
  /// value index (for Text/Comment/PI)
  pub Option<u32>,
  /// parent node index
  pub Option<u32>,
  /// first child node index
  pub Option<u32>,
  /// next sibling node index
  pub Option<u32>,
  /// optional attributes
  pub Option<Vec<WireAttr>>,
);

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, PartialEq, Eq, Hash,
)]
pub struct WireDoc(
  /// content type
  #[serde(borrow = "'static")]
  pub CowStr<'static>,
  /// quirks mode
  #[serde(borrow = "'static")]
  pub CowStr<'static>,
  /// interned strings table
  pub Vec<CowStr<'static>>,
  /// nodes list
  pub Vec<WireNode>,
);
