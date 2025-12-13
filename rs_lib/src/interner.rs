//! Simple string interner used internally by the dawm parser.
//!
//! ## Motivation
//!
//! Due to the way Rust handles memory allocation, allocating strings can be
//! relatively expensive in terms of performance and memory usage. When the
//! target environment is WASM, this cost is amplified even further due to the
//! overhead of crossing the WASM-JS boundary.
//!
//! ### Brief Overview of WASM String Handling
//!
//! > Note: the following is a simplified explanation of how strings and memory
//! > work in WebAssembly/Rust/JavaScript interop, intended to illustrate the
//! > motivation behind this interner implementation. Don't take this as a
//! > comprehensive guide to WASM memory management. Lol.
//!
//! Each and every string that the WebAssembly module allocates has to first be
//! allocated in the WASM memory space, and then copied over to the JavaScript
//! heap. Note that at this point, the "string" is still simply a sequence of
//! bytes, not a JavaScript string.
//!
//! To obtain the final string in JS-land, the bytes must be processed using
//! the native TextDecoder API (which is fast, but not free). This means that
//! every time a string is passed from WASM to JS, there is a non-trivial cost
//! associated with it.
//!
//! ### Interner Benefits
//!
//! The "interner" pattern is a common technique used to mitigate the cost of
//! string allocations. The idea is to maintain a table of unique strings, and
//! instead of passing around the strings themselves, we pass around small
//! integer indexes into this table.
//!
//! This affords us several benefits:
//!
//! 1. Reduced Memory Usage: Storing a **single copy** of each string reduces
//!    memory consumption, especially if the same strings are used repeatedly.
//! 2. Single Allocation: Each unique string is allocated only once, reducing
//!    the overhead of multiple allocations.
//! 3. Faster Comparisons: Comparing integers is significantly faster than
//!    comparing strings. As long as our program is aware of the interner and
//!    all string comparisons are **all** done via indices, we can achieve a
//!    significant speedup in basic string comparisons.
//! 4. Stable References: The indexes remain stable as long as the interner is
//!    still alive, allowing for consistent references to strings without the
//!    risk of dangling pointers or invalid references.
//! 5. Optional Pre-seeding: By pre-seeding the interner with common strings, we
//!    are able to stabilize the indexes of these strings across different runs
//!    of the program. This can be particularly useful for debugging, logging,
//!    or any scenario where consistent string references are desired.
//!
//! ## Decoding the Indices
//!
//! Since the primary target environment for dawm is WebAssembly, the strings
//! held in this table will have to be decoded into JS strings at some point.
//!
//! This is done on-demand, meaning that the strings are only decoded when
//! requested. This lazy decoding strategy helps to further reduce unnecessary
//! overhead, as strings that are never used in JS will never incur the cost of
//! decoding. For simplicity and smaller code size, the decoding is performed
//! entirely on the JS side using the native TextDecoder API.
//!
//! For environments that do not support the native TextEncoder / TextDecoder
//! APIs, a polyfill such as [`@nick/utf8`](https://jsr.io/@nick/utf8/doc) can
//! be used to ensure compatibility.
//!
//! ## Examples
//!
//! ```rust
//! use dawm::Interner;
//!
//! let mut interner = Interner::default();
//! let idx_hello = interner.intern("hello");
//! let idx_world = interner.intern("world");
//! let idx_hello_again = interner.intern("hello");
//!
//! assert_eq!(idx_hello, idx_hello_again); // Same string yields same index
//! assert_ne!(idx_hello, idx_world); // Different strings yield different indices
//! assert_eq!(interner[idx_hello as usize], "hello");
//! assert_eq!(interner[idx_world as usize], "world");
//! ```

use moos::CowStr;

/// A simple string interner used internally by the dawm parser.
///
/// See the [module level documentation](crate::interner) for more details.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Interner {
  #[cfg_attr(feature = "serde", serde(borrow = "'static"))]
  table: Vec<CowStr<'static>>,
}

impl Interner {
  pub const fn new() -> Self {
    Self { table: vec![] }
  }

  pub fn seed<T: AsRef<[S]>, S: ToString>(strings: T) -> Self {
    let mut interner = Self::new();
    interner = interner.extend(strings);
    interner
  }

  pub fn new_default_seed() -> Self {
    Self::seed([
      "", "html", "head", "body", "div", "span", "script", "style", "a", "img",
      "meta", "link", "rel", "class", "id", "hidden", "disabled", "content",
      "type", "href", "src", "title", "alt", "value",
    ])
  }

  pub fn new_extended_seed() -> Self {
    Self::new_default_seed().extend([
      "xmlns",
      "xlink",
      "http://www.w3.org/1999/xhtml",
      "http://www.w3.org/2000/svg",
      "http://www.w3.org/1999/xlink",
      "http://www.w3.org/XML/1998/namespace",
      "http://www.w3.org/2000/xmlns/",
      "http://www.w3.org/1998/Math/MathML",
      "svg",
      "xml",
      "align",
      "lang",
      "for",
      "width",
      "height",
      "role",
      "aria-hidden",
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
    ])
  }

  pub fn extend<T: AsRef<[S]>, S: ToString>(mut self, strings: T) -> Self {
    let strings = strings.as_ref();
    let mut i = 0;
    while i < strings.len() {
      self.table.push(strings[i].to_string().into());
      i += 1;
    }
    self
  }

  pub fn into_strings(self) -> Vec<CowStr<'static>> {
    self.table
  }

  pub fn intern<S: AsRef<str>>(&mut self, s: S) -> u32 {
    let s_ref = s.as_ref();
    // very small linear scan is fine for MVP; can switch to hash map later
    if let Some(idx) = self.table.iter().position(|x| &**x == s_ref) {
      idx as u32
    } else {
      self.table.push(s_ref.to_string().into());
      (self.table.len() - 1) as u32
    }
  }
}

impl Default for Interner {
  fn default() -> Self {
    Self::new_default_seed()
  }
}

impl core::ops::Deref for Interner {
  type Target = Vec<CowStr<'static>>;

  fn deref(&self) -> &Vec<CowStr<'static>> {
    &self.table
  }
}

impl core::ops::DerefMut for Interner {
  fn deref_mut(&mut self) -> &mut Vec<CowStr<'static>> {
    &mut self.table
  }
}
