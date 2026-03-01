use core::fmt::Debug;
use core::fmt::Display;
use core::fmt::Formatter;
use core::fmt::Result as FmtResult;
use core::str::FromStr;

use derive_more::with_trait::From;
use derive_more::with_trait::IsVariant;
use derive_more::with_trait::TryFrom;
use derive_more::with_trait::TryInto;
use markup5ever::interface::QuirksMode as ServoQuirksMode;
use serde::Deserialize;
use wasm_bindgen::prelude::*;

/// Represents the HTML quirks mode to use during parsing.
///
/// `QuirksMode` determines how the parser handles certain legacy behaviors
/// and rendering quirks that were present in older browsers. The mode can be
/// set to one of three options:
///
/// - `QuirksMode.Quirks` (`"quirks"`): Enables full quirks mode, emulating
///   older browser behavior for maximum compatibility with legacy content.
/// - `QuirksMode.LimitedQuirks` (`"limited-quirks"`): Enables a limited portion
///   of quirks mode, emulating _some_ legacy behaviors while still adhering to
///   modern standards in key areas.
/// - `QuirksMode.NoQuirks` (`"no-quirks"`, default): Disables quirks mode
///   entirely, ensuring the parser strictly follows modern HTML standards and
///   behaves consistently with contemporary browsers.
#[derive(Default, Clone, Copy, From, TryInto, TryFrom, IsVariant)]
#[from(ServoQuirksMode)]
#[try_into(owned, ref, ref_mut)]
#[try_from(repr)]
#[wasm_bindgen]
pub enum QuirksMode {
  Quirks = 0,
  LimitedQuirks = 1,
  #[default]
  NoQuirks = 2,
}

impl Debug for QuirksMode {
  fn fmt(&self, f: &mut Formatter<'_>) -> FmtResult {
    match self {
      QuirksMode::Quirks => write!(f, "quirks"),
      QuirksMode::LimitedQuirks => write!(f, "limited-quirks"),
      _ => write!(f, "no-quirks"),
    }
  }
}

impl From<&str> for QuirksMode {
  fn from(s: &str) -> Self {
    match s.parse() {
      Ok(mode) => mode,
      Err(_) => QuirksMode::NoQuirks,
    }
  }
}

impl Display for QuirksMode {
  fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
    match self {
      QuirksMode::Quirks => write!(f, "quirks"),
      QuirksMode::LimitedQuirks => write!(f, "limited-quirks"),
      _ => write!(f, "no-quirks"),
    }
  }
}

impl FromStr for QuirksMode {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    use crate::QuirksMode::*;
    match s.to_lowercase().trim() {
      "all" | "yes" | "full" | "quirks" => Ok(Quirks),
      "some" | "limited" | "partial" | "limited-quirks" => Ok(LimitedQuirks),
      _ => Ok(NoQuirks),
    }
  }
}

impl From<QuirksMode> for ServoQuirksMode {
  fn from(q: QuirksMode) -> Self {
    match q {
      QuirksMode::Quirks => ServoQuirksMode::Quirks,
      QuirksMode::LimitedQuirks => ServoQuirksMode::LimitedQuirks,
      _ => ServoQuirksMode::NoQuirks,
    }
  }
}

impl<'de> Deserialize<'de> for QuirksMode {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    let s: &str = serde::Deserialize::deserialize(deserializer)?;
    Ok(QuirksMode::from(s))
  }
}
