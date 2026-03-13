import assert from "node:assert";
import { describe, it } from "node:test";
import { HTMLDocument } from "../../src/html/HTMLDocument.ts";
import { Range } from "../../src/core/Range.ts";

function makeTextRange() {
  const doc = new HTMLDocument();
  const root = doc.createElement("div");
  doc.appendChild(root);
  const text = doc.createTextNode("hello");
  root.appendChild(text);
  return { doc, root, text };
}

describe("core/Range", () => {
  it("clones and stringifies contents", () => {
    const { text } = makeTextRange();
    const range = new Range(text, 0, text, 5);
    assert.strictEqual(range.toString(), "hello");
    const frag = range.cloneContents();
    assert.strictEqual(frag.textContent, "hello");
  });

  it("collapses and reports collapsed", () => {
    const { text } = makeTextRange();
    const range = new Range(text, 1, text, 3);
    range.collapse(true);
    assert.ok(range.collapsed);
  });
});
