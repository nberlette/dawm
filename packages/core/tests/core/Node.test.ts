import assert from "node:assert";
import { describe, it } from "node:test";
import { Element } from "../../src/Element.ts";
import { Text } from "../../src/Text.ts";
import { HTMLDocument } from "../../../html/src/HTMLDocument.ts";
import { Node } from "../../src/Node.ts";

describe("core/Node", () => {
  it("appends/inserts/replaces/removes children", () => {
    const doc = new HTMLDocument();
    const root = doc.createElement("div");
    doc.appendChild(root);

    const a = doc.createElement("span");
    const b = doc.createElement("b");
    root.appendChild(a);
    root.insertBefore(b, a);
    assert.strictEqual(root.firstChild, b);
    root.replaceChild(a, b);
    assert.strictEqual(root.firstChild, a);
    root.removeChild(a);
    assert.strictEqual(root.firstChild, null);
  });

  it("clones nodes deeply", () => {
    const root = new Element("div");
    const child = new Element("span");
    root.appendChild(child);
    const clone = root.cloneNode(true) as Element;
    assert.strictEqual(clone.firstChild?.nodeName, child.nodeName);
  });

  it("normalizes adjacent text", () => {
    const root = new Element("div");
    const t1 = new Text("a");
    const t2 = new Text("");
    const t3 = new Text("b");
    root.appendChild(t1);
    root.appendChild(t2);
    root.appendChild(t3);
    root.normalize();
    assert.strictEqual(root.childNodes.length, 1);
    assert.strictEqual(root.firstChild?.nodeValue, "ab");
  });

  it("compareDocumentPosition reports containment", () => {
    const doc = new HTMLDocument();
    const root = doc.createElement("div");
    const child = doc.createElement("span");
    root.appendChild(child);
    doc.appendChild(root);
    const contains = root.compareDocumentPosition(child) &
      Node.DOCUMENT_POSITION_CONTAINS;
    const contained = child.compareDocumentPosition(root) &
      Node.DOCUMENT_POSITION_CONTAINED_BY;
    assert.ok(contains !== 0);
    assert.ok(contained !== 0);
  });
});
