/**
 * # dawm
 *
 * A lightweight, high-performance, headless DOM toolkit for parsing, testing,
 * manipulating, and serializing HTML/XML markup in non-browser environments,
 * with an API surface closely aligned to the standard DOM APIs. Written in
 * Rust and TypeScript, with a powerful WASM-based DOMParser implementation.
 *
 * @example
 * ```ts
 * import dawm from "dawm";
 * import assert from "node:assert";
 *
 * const doc = dawm.parseHTML(`<div data-theme="light" id="main">
 *   <h1 class="text-4xl font-bold">Hello, world!</h1>
 * </div>`);
 *
 * assert.strictEqual(doc.body?.firstChild?.tagName, "DIV");
 * assert.strictEqual(doc.body.querySelector("h1")?.className, "text-4xl font-bold");
 * ```
 * @see https://npmjs.com/package/dawm
 * @see https://github.com/nberlette/dawm/#readme
 * @module dawm
 */
import { _ } from "./_internal.ts";

export * from "dawm-cache";
export * from "dawm-console";
export * from "dawm-core";
export * from "dawm-css";
export * from "dawm-encoding";
export * from "dawm-fetch";
export * from "dawm-html";
export * from "dawm-navigator";
export * from "dawm-storage";
export {
  buildDocumentTree,
  buildSubtree,
  querySelector,
  querySelectorAll,
  select,
  specificity,
  traverseSync,
  walk,
  walkSync,
} from "dawm-tree";
export * from "dawm-url";
export * from "dawm-view";
export * from "dawm-xhr";
export * from "dawm-xml";
export * from "dawm-xpath";
export * from "./options.ts";
export * from "./parse.ts";
export * from "./serialize.ts";
export * from "./types.ts";

// circular default export for compatibility with CJS conventions
export * as default from "./index.ts";

export * as "module.exports" from "./index.ts";
