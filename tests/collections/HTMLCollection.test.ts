import assert from "node:assert";
import { describe, it } from "node:test";
import { HTMLDocument } from "../../src/html/HTMLDocument.ts";
import {
  createHTMLCollection,
  HTMLCollection,
} from "../../src/collections/HTMLCollection.ts";

describe("collections/HTMLCollection", () => {
  it("tracks elements by index and name/id", () => {
    const doc = new HTMLDocument();
    const root = doc.createElement("div");
    doc.appendChild(root);

    const a = doc.createElement("a");
    a.id = "link";
    root.appendChild(a);

    const list = createHTMLCollection(root, () => Array.from(root.children));
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list.item(0), a);
    assert.strictEqual(list.namedItem("link"), a);

    const b = doc.createElement("span");
    b.setAttribute("name", "named");
    root.appendChild(b);

    assert.strictEqual(list.length, 2);
    assert.strictEqual(list.namedItem("named"), b);
  });

  it("allows index assignment on static collections", () => {
    const doc = new HTMLDocument();
    const a = doc.createElement("a");
    const b = doc.createElement("b");
    const list = new HTMLCollection(null, [a]);
    list[0] = b;
    assert.strictEqual(list.item(0), b);
  });
});
