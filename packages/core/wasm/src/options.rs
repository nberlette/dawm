use html5ever::tree_builder::TreeBuilderOpts;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;

use crate::QuirksMode;

#[derive(Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct ParseOptions {
  pub exact_errors: bool,
  #[serde(rename = "allowScripts")]
  pub scripting_enabled: bool,
  pub iframe_srcdoc: bool,
  pub drop_doctype: bool,
  pub quirks_mode: QuirksMode,
  pub content_type: Option<String>,
}

impl Default for ParseOptions {
  fn default() -> Self {
    Self {
      exact_errors: false,
      scripting_enabled: false,
      iframe_srcdoc: false,
      drop_doctype: false,
      quirks_mode: default_quirks_mode().parse().unwrap_or_default(),
      content_type: Some(default_mime_type()),
    }
  }
}

#[derive(Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct FragmentParseOptions {
  #[serde(flatten)]
  pub base: ParseOptions,
  pub context_element: String,
}

impl Default for FragmentParseOptions {
  fn default() -> Self {
    Self {
      base: ParseOptions {
        drop_doctype: true,
        ..Default::default()
      },
      context_element: default_context_element(),
    }
  }
}

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

    TreeBuilderOpts {
      exact_errors,
      scripting_enabled,
      iframe_srcdoc,
      drop_doctype,
      quirks_mode: quirks_mode.into(),
    }
  }
}

pub fn options_from_js_or_default<T: Default + for<'de> Deserialize<'de>>(
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

pub fn default_mime_type() -> String {
  normalized_mime("").into()
}

pub fn default_quirks_mode() -> String {
  "no-quirks".into()
}

pub fn default_context_element() -> String {
  "div".into()
}

pub fn is_html_mime(mime: &str) -> bool {
  matches!(normalized_mime(mime), "text/html")
}

pub fn normalized_mime(mime: &str) -> &'static str {
  match mime.trim().to_ascii_lowercase().as_str() {
    "text/html" | "text/html4" | "text/html5" => "text/html",
    "text/xhtml" | "application/xhtml" | "application/xhtml+xml" => {
      "application/xhtml+xml"
    }
    "image/svg" | "image/svg+xml" | "application/svg+xml" => "image/svg+xml",
    _ => "application/xml",
  }
}
