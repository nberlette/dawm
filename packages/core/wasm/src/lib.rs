extern crate alloc;
extern crate core;

pub mod interner;
pub mod options;
pub mod quirks_mode;
pub mod rcdom;
pub mod serialize;
pub mod wire;

use serde_wasm_bindgen::to_value;
use wasm_bindgen::prelude::*;

pub use interner::Interner;
pub use options::{
  FragmentParseOptions, ParseOptions, default_context_element,
  default_mime_type, default_quirks_mode, is_html_mime, normalized_mime,
  options_from_js_or_default,
};
pub use quirks_mode::QuirksMode;
pub use rcdom::*;
pub use serialize::serialize_dom;
pub use wire::{WireAttr, WireDoc, WireNode, WireNodeType};

#[cfg(feature = "html")]
use html5ever::QualName;
#[cfg(feature = "html")]
use html5ever::tendril::TendrilSink;
#[cfg(feature = "html")]
use html5ever::tokenizer::TokenizerOpts;
#[cfg(feature = "html")]
use html5ever::tree_builder::TreeBuilderOpts;
#[cfg(feature = "html")]
use html5ever::{ParseOpts, parse_document as parse_html_document_inner, parse_fragment};

#[cfg(feature = "xml")]
use xml5ever::driver::{XmlParseOpts, parse_document as parse_xml_document_inner};
#[cfg(feature = "xml")]
use xml5ever::tokenizer::XmlTokenizerOpts;

#[cfg(feature = "html")]
#[wasm_bindgen]
pub fn parse_html(input: &str, options: Option<JsValue>) -> JsValue {
  let parse_options = options
    .as_ref()
    .map_or_else(ParseOptions::default, options_from_js_or_default);

  let dom = parse_html_document(input, &parse_options);
  let wire = serialize_dom(dom, "text/html");
  to_value(&wire).unwrap_or(JsValue::NULL)
}

#[cfg(feature = "html")]
#[wasm_bindgen]
pub fn parse_frag(input: &str, options: JsValue) -> JsValue {
  let mut frag_options = FragmentParseOptions::default();
  if options.is_string() {
    frag_options.context_element = options.as_string().unwrap_or_default();
  } else if !options.is_undefined() && !options.is_null() {
    frag_options = options_from_js_or_default(&options);
  }

  let dom = parse_html_fragment(input, &frag_options);
  let wire = serialize_dom(dom, "text/html");
  to_value(&wire).unwrap_or(JsValue::NULL)
}

#[cfg(feature = "xml")]
#[wasm_bindgen]
pub fn parse_xml(input: &str, options: JsValue) -> JsValue {
  let mut parse_options = ParseOptions::default();
  let mut mime = String::from("application/xml");

  if options.is_string() {
    if let Some(value) = options.as_string() {
      mime = value;
    }
  } else if !options.is_undefined() && !options.is_null() {
    parse_options = options_from_js_or_default(&options);
    if let Some(value) = parse_options.content_type.clone() {
      mime = value;
    }
  }

  let normalized = normalized_mime(&mime);
  let content_type = if normalized == "text/html" {
    "application/xml"
  } else {
    normalized
  };

  parse_options.content_type = Some(content_type.to_string());

  let dom = parse_xml_document(input, &parse_options);
  let wire = serialize_dom(dom, content_type);
  to_value(&wire).unwrap_or(JsValue::NULL)
}

#[cfg(feature = "html")]
pub fn parse_html_document(input: &str, options: &ParseOptions) -> RcDom {
  let sink = RcDom::default();
  let tree_builder: TreeBuilderOpts = options.clone().into();
  let tokenizer = TokenizerOpts {
    exact_errors: options.exact_errors,
    ..Default::default()
  };

  let opts = ParseOpts {
    tree_builder,
    tokenizer,
  };

  parse_html_document_inner(sink, opts)
    .from_utf8()
    .read_from(&mut input.as_bytes())
    .expect("failed to parse HTML input")
}

#[cfg(feature = "html")]
pub fn parse_html_fragment(
  input: &str,
  options: &FragmentParseOptions,
) -> RcDom {
  let sink = RcDom::default();
  let tree_builder: TreeBuilderOpts = options.base.clone().into();
  let tokenizer = TokenizerOpts {
    exact_errors: options.base.exact_errors,
    ..Default::default()
  };

  let opts = ParseOpts {
    tree_builder,
    tokenizer,
  };

  parse_fragment(
    sink,
    opts,
    QualName::new(
      None,
      html5ever::ns!(html),
      options.context_element.clone().into(),
    ),
    vec![],
    false,
  )
  .from_utf8()
  .read_from(&mut input.as_bytes())
  .expect("failed to parse HTML fragment")
}

#[cfg(feature = "xml")]
pub fn parse_xml_document(input: &str, options: &ParseOptions) -> RcDom {
  let sink = RcDom::default();
  let opts = XmlParseOpts {
    tokenizer: XmlTokenizerOpts {
      exact_errors: options.exact_errors,
      ..Default::default()
    },
    ..Default::default()
  };

  parse_xml_document_inner(sink, opts)
    .from_utf8()
    .read_from(&mut input.as_bytes())
    .expect("failed to parse XML input")
}
