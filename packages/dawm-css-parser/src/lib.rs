extern crate alloc;
extern crate core;

use lightningcss::stylesheet::ParserOptions;
use lightningcss::stylesheet::PrinterOptions;
use lightningcss::stylesheet::StyleSheet;
use serde::Deserialize;
use serde::Serialize;
use serde_wasm_bindgen::{from_value, to_value};
use wasm_bindgen::prelude::*;

#[derive(Deserialize, Debug, Clone)]
#[serde(default, rename_all = "camelCase")]
pub struct CssParseOptions {
  pub minify: bool,
}

impl Default for CssParseOptions {
  fn default() -> Self {
    Self { minify: false }
  }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
struct CssParseResult<'i, 'o> {
  code: String,
  had_error: bool,
  error: Option<String>,
  sheet: Option<StyleSheet<'i, 'o>>,
}

#[wasm_bindgen]
pub fn parse_css(input: &str, options: Option<JsValue>) -> JsValue {
  let parse_options =
    options.as_ref().map_or_else(CssParseOptions::default, |o| {
      if o.is_null() || o.is_undefined() {
        CssParseOptions::default()
      } else {
        from_value(o.clone()).unwrap_or_default()
      }
    });

  let sheet = match StyleSheet::parse(input, ParserOptions::default()) {
    Ok(sheet) => sheet,
    Err(error) => {
      let result = CssParseResult {
        code: input.to_string(),
        had_error: true,
        error: Some(error.to_string()),
        sheet: None,
      };
      return to_value(&result).unwrap_or(JsValue::NULL);
    }
  };

  let code = match sheet.to_css(PrinterOptions {
    minify: parse_options.minify,
    ..Default::default()
  }) {
    Ok(output) => output.code,
    Err(error) => {
      let result = CssParseResult {
        code: String::new(),
        had_error: true,
        error: Some(error.to_string()),
        sheet: Some(sheet),
      };
      return to_value(&result).unwrap_or(JsValue::NULL);
    }
  };

  let result = CssParseResult {
    code,
    had_error: false,
    error: None,
    sheet: Some(sheet),
  };

  to_value(&result).unwrap_or(JsValue::NULL)
}
