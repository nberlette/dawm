#![feature(const_convert)]
#![feature(const_index)]
#![feature(const_trait_impl)]

extern crate alloc;
extern crate core;

use alloc::string::String;

use derive_more::with_trait::Debug;
use derive_more::with_trait::From;
use derive_more::with_trait::*;
use html5ever::QualName;
use html5ever::tendril::*;
use html5ever::tokenizer::*;
use html5ever::tree_builder::*;
use html5ever::*;
use js_sys::Object;
use markup5ever::interface::QuirksMode as ServoQuirksMode;
use moos::CowStr;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

pub mod rcdom;
pub use rcdom::*;

pub mod wire;
pub use wire::*;

pub mod interner;
pub use interner::*;

pub mod quirks_mode;
pub use quirks_mode::QuirksMode;

/// Parses a given input string as either an HTML or XML-like document,
/// returning a serialized representation of the [`RcDom`] structure. The
/// `mime` parameter determines whether to parse as HTML or XML-like. The
/// optional `options` parameter allows customization of parsing behavior, such
/// as quirks mode, error handling, and content type, among others.
///
/// Note that the returned structure is **flat**. To obtain a hierarchical tree
/// structure that reflects parent-child relationships within the DOM, the
/// returned data should first have all its numeric string indices resolved to
/// actual strings (via the `.strings` array), followed by its nodes being
/// resolved into a tree based on parent-child and sibling relationships.
///
/// As with the strings, node hierarchies are represented using integer indices
/// that need to be resolved relative to the `.nodes` array.
#[wasm_bindgen]
pub fn parse_doc(input: &str, mime: &str, options: Option<Object>) -> JsValue {
  let mime_lower = mime.trim().to_ascii_lowercase();

  let parse_options = options
    .as_ref()
    .map_or_else(ParseOptions::default, |o| options_from_js_or_default(o));

  let parsed = if is_html_mime(&mime_lower) {
    let dom = parse_html_document(input, &parse_options);
    serialize_dom(dom, "text/html")
  } else {
    let dom = parse_xml_like(input, &parse_options);
    // Distinguish SVG/XML/XHTML by mime; default application/xml
    let ct = normalized_mime(&mime_lower);
    serialize_dom(dom, ct)
  };

  to_value(&parsed).unwrap_or(JsValue::NULL)
}

/// Parses a given input string as an HTML document, returning a serialized
/// representation of the [`RcDom`] structure. The node structure will require
/// further processing to build a tree and resolve string references.
///
/// @see {@linkcode parse_frag} for parsing HTML fragments.
/// @see {@linkcode parse_xml} for parsing XML-like documents.
#[wasm_bindgen]
pub fn parse_html(input: &str, options: Option<Object>) -> JsValue {
  let parse_options = options
    .as_ref()
    .map_or_else(ParseOptions::default, |o| options_from_js_or_default(o));

  let dom = parse_html_document(input, &parse_options);
  let parsed = serialize_dom(dom, "text/html");
  // let resolved = resolve_wire_doc(parsed);
  to_value(&parsed).unwrap_or(JsValue::NULL)
}

/// Parses a given input string as an XML-like document (XML, SVG, XHTML),
/// returning a serialized representation of the [`RcDom`] structure. The
/// node structure will require further processing to build a tree and resolve
/// string references.
///
/// @see {@linkcode parse_html} for parsing HTML documents.
/// @see {@linkcode parse_frag} for parsing HTML fragments.
#[cfg(feature = "xml")]
#[wasm_bindgen]
pub fn parse_xml(input: &str, options: JsValue) -> JsValue {
  let mut parse_options = ParseOptions::default();
  let mut mime = CowStr::from("application/xml");
  if options.is_string() {
    mime = options.as_string().map(|s| s.into()).unwrap_or(mime);
  } else if !options.is_undefined() && !options.is_null() {
    parse_options = from_value(options).unwrap_or_default();
    mime = parse_options
      .content_type
      .clone()
      .unwrap_or(mime.into())
      .into()
  }
  let mime = normalized_mime(&mime.trim().to_ascii_lowercase());
  parse_options.content_type = Some(mime.into());

  let dom = parse_xml_like(input, &parse_options);
  let serialized = serialize_dom(dom, mime);
  to_value(&serialized).unwrap_or(JsValue::NULL)
}

/// Parses a given input string as an HTML fragment within the context of a
/// specified element, returning a serialized representation of the [`RcDom`]
/// structure. The node structure will require further processing to build a
/// tree and resolve string references.
///
/// @see {@linkcode parse_html} for parsing full HTML documents.
#[wasm_bindgen]
pub fn parse_frag(input: &str, options: JsValue) -> JsValue {
  let mut frag_options = FragmentParseOptions::default();
  if options.is_string() {
    frag_options.context_element =
      options.as_string().map(|s| s.into()).unwrap_or_default();
  } else if !options.is_undefined() && !options.is_null() {
    frag_options = from_value(options).unwrap_or_default();
  }

  let dom = parse_html_fragment(input, &frag_options);
  let parsed = serialize_dom(dom, "text/html");
  // let resolved = resolve_wire_doc(parsed);
  to_value(&parsed).unwrap_or(JsValue::NULL)
}

/// Options for configuring the behavior of the dawm parsing engine.
///
/// | Option           | Default       | Description                         |
/// |------------------|---------------|-------------------------------------|
/// | `allowScripts`   | `true`        | Enables scripting features.         |
/// | `contentType`    | `"text/html"` | Controls which parser is used.      |
/// | `contextElement` | `"div"`       | Context element for HTML fragments. |
/// | `dropDoctype`    | `false`       | Strips the doctype from the output. |
/// | `exactErrors`    | `true`        | Enables precise error reporting.    |
/// | `iframeSrcdoc`   | `false`       | Indicates if parsing iframe srcdoc. |
/// | `quirksMode`     | `"no-quirks"` | Sets the document's quirks mode.    |
#[derive(Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct ParseOptions {
  pub exact_errors:      bool,
  #[serde(rename = "allowScripts")]
  pub scripting_enabled: bool,
  pub iframe_srcdoc:     bool,
  pub drop_doctype:      bool,
  pub quirks_mode:       QuirksMode,
  pub content_type:      Option<String>,
}

impl Default for ParseOptions {
  fn default() -> Self {
    Self {
      exact_errors:      true,
      scripting_enabled: true,
      iframe_srcdoc:     false,
      drop_doctype:      false,
      quirks_mode:       default_quirks_mode().parse().unwrap_or_default(),
      content_type:      Some(default_mime_type()),
    }
  }
}

// Extension for fragment parsing that includes context element name
#[derive(Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct FragmentParseOptions {
  #[serde(flatten)]
  pub base:            ParseOptions,
  pub context_element: String,
}

impl Default for FragmentParseOptions {
  fn default() -> Self {
    Self {
      base:            ParseOptions {
        drop_doctype: true, // Different default for fragments
        iframe_srcdoc: false,
        ..Default::default()
      },
      context_element: default_context_element().into(),
    }
  }
}

// Convert ParseOptions to TreeBuilderOpts
impl From<ParseOptions> for TreeBuilderOpts {
  fn from(opts: ParseOptions) -> Self {
    let ParseOptions {
      exact_errors,
      scripting_enabled,
      iframe_srcdoc,
      drop_doctype,
      quirks_mode,
      ..
    } = opts;
    let quirks_mode = quirks_mode.into();

    TreeBuilderOpts {
      exact_errors,
      scripting_enabled,
      iframe_srcdoc,
      drop_doctype,
      quirks_mode,
    }
  }
}

// Helper function to parse options from JS or use defaults
fn options_from_js_or_default<T: Default + for<'de> Deserialize<'de>>(
  js_value: &JsValue,
) -> T {
  if js_value.is_null() || js_value.is_undefined() {
    T::default()
  } else {
    match from_value(js_value.clone()) {
      Ok(options) => options,
      Err(_) => T::default(),
    }
  }
}

fn serialize_dom(dom: RcDom, content_type: &'static str) -> WireDoc {
  let mut interner = Interner::default();

  let mut nodes = Vec::new();
  collect(&dom.document, None, &mut interner, &mut nodes);

  // html5ever exposes quirks mode on the document node via RcDom quirks_mode
  // RcDom quirks_mode: ServoQuirksMode::{NoQuirks, Quirks, LimitedQuirks}
  let quirks_mode = match dom.quirks_mode.get() {
    ServoQuirksMode::NoQuirks => "no-quirks",
    ServoQuirksMode::Quirks => "quirks",
    ServoQuirksMode::LimitedQuirks => "limited-quirks",
  }
  .into();

  let strings = interner.into_strings();

  WireDoc {
    strings,
    nodes,
    content_type: content_type.into(),
    quirks_mode,
  }
}

fn collect(
  handle: &Handle,
  parent: Option<u32>,
  interner: &mut Interner,
  nodes: &mut Vec<WireNode>,
) -> u32 {
  let id = nodes.len() as u32;
  let mut wire = WireNode {
    id,
    parent,
    first_child: None,
    next_sibling: None,
    node_type: WireNodeType::Document,
    name: None,
    value: None,
    attrs: None,
  };

  match &handle.data {
    NodeData::Document => {
      wire.node_type = WireNodeType::Document;
      wire.parent = None;
      wire.name = Some(interner.intern("#document"));
    }
    NodeData::Doctype {
      name,
      public_id,
      system_id,
    } => {
      wire.node_type = WireNodeType::DocumentType;
      wire.name = Some(interner.intern(name));
      // Combine doctype into value: "<name> <public_id> <system_id>"
      let mut val = format!("{name}");

      let mut attributes = Vec::new();
      attributes.push(WireAttr {
        ns:    None,
        name:  interner.intern("name"),
        value: interner.intern(name),
      });

      if !public_id.is_empty() {
        val.push(' ');
        val.push_str(&format!(r#"PUBLIC "{public_id}"#));
        attributes.push(WireAttr {
          ns:    None,
          name:  interner.intern("publicId"),
          value: interner.intern(public_id),
        });
      }
      if !system_id.is_empty() {
        val.push(' ');
        val.push_str(&format!(r#"SYSTEM "{system_id}"#));
        attributes.push(WireAttr {
          ns:    None,
          name:  interner.intern("systemId"),
          value: interner.intern(system_id),
        });
      }
      wire.value = Some(interner.intern(val.trim().to_string()));
    }
    NodeData::Text { contents } => {
      wire.node_type = WireNodeType::Text;
      wire.name = Some(interner.intern("#text"));
      wire.value = Some(interner.intern(contents.borrow().as_ref()));
    }
    NodeData::Comment { contents } => {
      wire.node_type = WireNodeType::Comment;
      wire.name = Some(interner.intern("#comment"));
      wire.value = Some(interner.intern(contents));
    }
    NodeData::ProcessingInstruction { target, contents } => {
      wire.node_type = WireNodeType::ProcessingInstruction;
      wire.name = Some(interner.intern(target));
      wire.value = Some(interner.intern(contents));
    }
    NodeData::Element { name, attrs, .. } => {
      wire.node_type = WireNodeType::Element;
      wire.name = Some(intern_qual(name, interner));
      let attributes = attrs.borrow();
      if !attributes.is_empty() {
        let mut wa = Vec::with_capacity(attributes.len());
        for a in attributes.iter() {
          let ns = if a.name.ns.is_empty() {
            None
          } else {
            Some(interner.intern(a.name.ns.as_ref()))
          };
          wa.push(WireAttr {
            name: intern_qual_local(&a.name, interner),
            ns,
            value: interner.intern(a.value.as_ref()),
          });
        }
        wire.attrs = Some(wa);
      }
    }
  }

  nodes.push(wire);

  // children
  let kids = handle.children.borrow();
  let mut last_id: Option<u32> = None;
  for (i, child) in kids.iter().enumerate() {
    let cid = collect(child, Some(id), interner, nodes);
    if i == 0 {
      // set first_child on current node
      let node = nodes.get_mut(id as usize).unwrap();
      node.first_child = Some(cid);
    } else if let Some(prev) = last_id {
      // set next_sibling on previous child
      let prev_node = nodes.get_mut(prev as usize).unwrap();
      prev_node.next_sibling = Some(cid);
    }
    last_id = Some(cid);
  }

  id
}

fn intern_qual(q: &QualName, interner: &mut Interner) -> u32 {
  let prefix = q.prefix.as_ref().map(|p| p.as_ref()).unwrap_or("");
  let local = q.local.as_ref();
  let ns = q.ns.as_ref();
  if !ns.is_empty() {
    interner.intern(ns);
  };
  let local_idx = interner.intern(local);
  if !prefix.is_empty() {
    // Combine namespace and local name into single string for simplicity
    interner.intern(format!("{prefix}:{local}"))
  } else {
    local_idx
  }
}

fn intern_qual_local(
  q: &markup5ever::QualName,
  interner: &mut Interner,
) -> u32 {
  interner.intern(q.local.as_ref())
}

fn default_mime_type() -> String {
  normalized_mime("").into()
}

fn default_quirks_mode() -> String {
  "no-quirks".into()
}

fn default_context_element() -> String {
  "div".into()
}

fn is_html_mime(m: &str) -> bool {
  matches!(normalized_mime(m), "text/html" | "application/xhtml+xml")
}

fn normalized_mime(m: &str) -> &'static str {
  match m.trim().to_lowercase().as_str() {
    "text/html" | "text/html4" | "text/html5" => "text/html",
    "text/xhtml" | "application/xhtml" | "application/xhtml+xml" => {
      "application/xhtml+xml"
    }
    "image/svg" | "image/svg+xml" | "application/svg+xml" => "image/svg+xml",
    _ => "application/xml",
  }
}

pub fn parse_html_fragment(
  input: &str,
  options: &FragmentParseOptions,
) -> RcDom {
  let sink = RcDom::default();
  // Convert our options to TreeBuilderOpts
  let tree_builder: TreeBuilderOpts = options.base.clone().into();
  let tokenizer = TokenizerOpts {
    exact_errors: options.base.exact_errors,
    ..Default::default()
  };
  let opts = ParseOpts {
    tree_builder,
    tokenizer,
  };
  html5ever::parse_fragment(
    sink,
    opts,
    QualName::new(None, ns!(html), options.context_element.clone().into()),
    vec![],
    false,
  )
  .from_utf8()
  .read_from(&mut input.as_bytes())
  .expect("failed to parse HTML fragment")
}

pub fn parse_html_document(input: &str, options: &ParseOptions) -> RcDom {
  let sink = RcDom::default();

  // Convert our options to TreeBuilderOpts
  let tree_builder: TreeBuilderOpts = options.clone().into();

  let tokenizer = TokenizerOpts {
    exact_errors: options.exact_errors,
    ..Default::default()
  };

  let opts = ParseOpts {
    tree_builder,
    tokenizer,
  };

  html5ever::parse_document(sink, opts)
    .from_utf8()
    .read_from(&mut input.as_bytes())
    .expect("failed to parse HTML input")
}

#[cfg(feature = "xml")]
pub fn parse_xml_like(input: &str, _options: &ParseOptions) -> RcDom {
  // xml5ever uses the same TreeSink trait; use RcDom as sink
  // Note: XML parser doesn't use the same options structure currently
  let sink = RcDom::default();
  let opts: xml5ever::driver::XmlParseOpts = Default::default();
  let p = xml5ever::driver::parse_document(sink, opts);
  p.input_buffer.push_back(input.into());
  p.finish()
}
