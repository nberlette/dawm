use derive_more::with_trait::Debug;
use derive_more::with_trait::Into;
use serde::Deserialize;
use serde::Serialize;
use serde_repr::Deserialize_repr;
use serde_repr::Serialize_repr;
use wasm_bindgen::prelude::*;

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
#[wasm_bindgen(js_name = NodeType)]
#[repr(u8)]
pub enum WireNodeType {
  #[default]
  Element = 1,
  Attribute = 2,
  Text = 3,
  CData = 4,
  EntityReference = 5,
  Entity = 6,
  ProcessingInstruction = 7,
  Comment = 8,
  Document = 9,
  DocumentType = 10,
  DocumentFragment = 11,
  Notation = 12,
}

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, Copy, PartialEq, Eq, Hash,
)]
#[serde(default, rename_all = "camelCase")]
pub(crate) struct WireAttr {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) ns:    Option<u32>, // namespace url idx
  pub(crate) name:  u32, // string idx
  pub(crate) value: u32, // string idx
}

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, PartialEq, Eq, Hash,
)]
#[serde(default, rename_all = "camelCase")]
pub(crate) struct WireNode {
  pub(crate) id:           u32,
  pub(crate) node_type:    WireNodeType,
  #[serde(rename = "nodeName")]
  pub(crate) name:         Option<u32>, // Element/PI name (string idx)
  #[serde(rename = "nodeValue", skip_serializing_if = "Option::is_none")]
  pub(crate) value:        Option<u32>, // Text/Comment/PI (string idx)
  #[serde(rename = "parentNode")]
  pub(crate) parent:       Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) first_child:  Option<u32>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) next_sibling: Option<u32>,
  #[serde(rename = "attributes", skip_serializing_if = "Option::is_none")]
  pub(crate) attrs:        Option<Vec<WireAttr>>,
}

#[derive(
  Serialize, Deserialize, Default, Debug, Clone, PartialEq, Eq, Hash,
)]
#[serde(default, rename_all = "camelCase")]
pub(crate) struct WireDoc {
  #[serde(borrow = "'static")]
  pub(crate) content_type: CowStr<'static>,
  #[serde(borrow = "'static")]
  pub(crate) quirks_mode:  CowStr<'static>,
  pub(crate) strings:      Vec<CowStr<'static>>,
  pub(crate) nodes:        Vec<WireNode>,
}
