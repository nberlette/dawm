import assert from "node:assert";
import { describe, it } from "node:test";
import { Element } from "../../src/Element.ts";
import { HTMLDocument } from "../../../html/src/HTMLDocument.ts";
import { XMLDocument } from "../../../xml/src/XMLDocument.ts";
import { assertThrowsDOM } from "dawm-testing/utils";

describe("core/Element", () => {
  it("sets/gets/removes attributes", () => {
    const el = new Element("div");
    el.setAttribute("title", "hello");
    assert.strictEqual(el.getAttribute("title"), "hello");
    assert.ok(el.hasAttribute("title"));
    el.removeAttribute("title");
    assert.strictEqual(el.getAttribute("title"), null);
  });

  it("toggleAttribute respects force and HTML lowercasing", () => {
    const doc = new HTMLDocument();
    const el = doc.createElement("div");
    el.namespaceURI = "http://www.w3.org/1999/xhtml";
    const first = el.toggleAttribute("DATA-Test");
    assert.strictEqual(first, true);
    assert.ok(el.hasAttribute("data-test"));

    const removed = el.toggleAttribute("data-test", false);
    assert.strictEqual(removed, false);
    assert.ok(!el.hasAttribute("data-test"));

    const forced = el.toggleAttribute("data-test", true);
    assert.strictEqual(forced, true);
    assert.ok(el.hasAttribute("data-test"));
  });

  it("toggleAttribute preserves case for XML documents", () => {
    const doc = new XMLDocument();
    const el = doc.createElement("Thing");
    el.toggleAttribute("Data-Attr");
    assert.ok(el.hasAttribute("Data-Attr"));
  });

  it("rejects invalid qualified names", () => {
    const el = new Element("div");
    assertThrowsDOM(() => el.toggleAttribute("a b"), "InvalidCharacterError");
  });

  it("outerHTML throws on disconnected element", () => {
    const el = new Element("div");
    assert.throws(() => {
      el.outerHTML = "<span></span>";
    }, /disconnected/i);
  });
});
