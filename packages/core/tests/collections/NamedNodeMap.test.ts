import assert from "node:assert";
import { describe, it } from "node:test";
import { Attr } from "../../src/Attr.ts";
import { Element } from "../../src/Element.ts";
import { assertThrowsDOM } from "dawm-testing/utils";

describe("collections/NamedNodeMap", () => {
  it("gets/sets attributes by name (case-insensitive)", () => {
    const el = new Element("div");
    el.setAttribute("id", "root");
    const attrs = el.attributes;
    assert.strictEqual(attrs.getNamedItem("ID")?.value, "root");
  });

  it("setNamedItem replaces existing and returns old", () => {
    const el = new Element("div");
    const attrs = el.attributes;
    const first = new Attr("title", "a", null, el);
    attrs.setNamedItem(first);
    const second = new Attr("title", "b", null, el);
    const prev = attrs.setNamedItem(second);
    assert.strictEqual(prev, first);
    assert.strictEqual(attrs.getNamedItem("title")?.value, "b");
  });

  it("removeNamedItem throws for missing", () => {
    const el = new Element("div");
    const attrs = el.attributes;
    assertThrowsDOM(() => attrs.removeNamedItem("missing"), "NotFoundError");
  });
});
