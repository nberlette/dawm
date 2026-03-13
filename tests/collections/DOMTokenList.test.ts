import assert from "node:assert";
import { describe, it } from "node:test";
import { Element } from "../../src/core/Element.ts";

describe("collections/DOMTokenList", () => {
  it("adds/removes/toggles tokens and syncs attribute", () => {
    const el = new Element("div");
    el.setAttribute("class", "a b");
    const list = el.classList;

    assert.ok(list.contains("a"));
    list.add("c");
    assert.strictEqual(el.getAttribute("class"), "a b c");

    list.remove("a");
    assert.ok(!list.contains("a"));
    assert.strictEqual(el.getAttribute("class"), "b c");

    const toggled = list.toggle("b");
    assert.strictEqual(toggled, false);
    assert.ok(!list.contains("b"));

    const forced = list.toggle("d", true);
    assert.strictEqual(forced, true);
    assert.ok(list.contains("d"));
  });

  it("replaces tokens and de-dupes", () => {
    const el = new Element("div");
    el.setAttribute("class", "a b b");
    const list = el.classList;

    assert.strictEqual(list.replace("b", "c"), true);
    assert.strictEqual(el.getAttribute("class"), "a c");
    assert.strictEqual(list.replace("missing", "x"), false);
  });

  it("supports returns true", () => {
    const el = new Element("div");
    assert.strictEqual(el.classList.supports("anything"), true);
  });
});
