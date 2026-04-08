import assert from "node:assert";
import { describe, it } from "node:test";
import { HTMLDocument } from "../../../html/src/HTMLDocument.ts";

describe("collections/DOMStringMap", () => {
  it("reflects data-* attributes to dataset", () => {
    const doc = new HTMLDocument();
    const el = doc.createElement("div");
    el.setAttribute("data-user-id", "42");
    const dataset = el.dataset;
    assert.strictEqual(dataset.userId, "42");
  });

  it("writes back to attributes", () => {
    const doc = new HTMLDocument();
    const el = doc.createElement("div");
    const dataset = el.dataset;
    dataset.fooBar = "baz";
    assert.strictEqual(el.getAttribute("data-foo-bar"), "baz");
    delete dataset.fooBar;
    assert.strictEqual(el.getAttribute("data-foo-bar"), null);
  });
});
