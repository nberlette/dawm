import assert from "node:assert";
import { describe, it } from "node:test";
import { Attr } from "../../src/Attr.ts";
import { Element } from "../../src/Element.ts";

describe("core/Attr", () => {
  it("tracks ownerElement and value", () => {
    const el = new Element("div");
    const attr = new Attr("title", "hello", null, el);
    el.setAttributeNode(attr);
    assert.strictEqual(attr.ownerElement, el);
    attr.value = "updated";
    assert.strictEqual(attr.value, "updated");
  });

  it("cloneNode preserves value", () => {
    const attr = new Attr("title", "hello");
    const clone = attr.cloneNode();
    assert.strictEqual(clone.value, "hello");
  });

  it("disallows child operations", () => {
    const attr = new Attr("title", "hello");
    assert.throws(
      () => (attr as any).appendChild(new Element("div")),
      /Attr nodes cannot have children/,
    );
  });
});
