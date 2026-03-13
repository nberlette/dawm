import assert from "node:assert";
import { describe, it } from "node:test";
import { Element } from "../../src/core/Element.ts";
import { Text } from "../../src/core/Text.ts";

describe("core/Text", () => {
  it("computes wholeText across siblings", () => {
    const root = new Element("div");
    const a = new Text("a");
    const b = new Text("b");
    root.appendChild(a);
    root.appendChild(b);
    assert.strictEqual(a.wholeText, "ab");
  });

  it("splits text nodes", () => {
    const root = new Element("div");
    const t = new Text("hello");
    root.appendChild(t);
    const tail = t.splitText(2);
    assert.strictEqual(t.data, "he");
    assert.strictEqual(tail.data, "llo");
    assert.strictEqual(root.childNodes.length, 2);
  });
});
