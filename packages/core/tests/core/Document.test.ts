import assert from "node:assert";
import { describe, it } from "node:test";
import { Document } from "../../src/Document.ts";
import { NodeType } from "../../src/types.ts";

describe("core/Document", () => {
  it("creates elements, attributes, and fragments", () => {
    const doc = new Document("text/html", "no-quirks");
    const el = doc.createElement("div");
    assert.strictEqual(el.ownerDocument, doc);
    const attr = doc.createAttribute("title", "hello");
    assert.strictEqual(attr.value, "hello");
    const frag = doc.createDocumentFragment();
    assert.strictEqual(frag.nodeType, NodeType.DocumentFragment);
  });

  it("creates namespaced elements", () => {
    const doc = new Document("text/html", "no-quirks");
    const el = doc.createElementNS("http://www.w3.org/1999/xhtml", "svg");
    assert.strictEqual(el.namespaceURI, "http://www.w3.org/1999/xhtml");
  });

  it("tracks documentElement/head/body", () => {
    const doc = new Document("text/html", "no-quirks");
    const html = doc.createElement("html");
    const head = doc.createElement("head");
    const body = doc.createElement("body");
    doc.appendChild(html);
    html.appendChild(head);
    html.appendChild(body);

    assert.strictEqual(doc.documentElement, html);
    assert.strictEqual(doc.head, head);
    assert.strictEqual(doc.body, body);
  });

  it("exposes a stable document.styleSheets list", () => {
    const doc = new Document("text/html", "no-quirks");
    assert.strictEqual(doc.styleSheets.length, 0);
    assert.strictEqual(doc.styleSheets, doc.styleSheets);
  });
});
