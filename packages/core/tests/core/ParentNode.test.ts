import assert from "node:assert";
import { describe, it } from "node:test";
import { buildSampleDOM } from "../../../../test-support/_utils.ts";

describe("core/ParentNode", () => {
  it("queries elements by tag and class", () => {
    const { doc, root } = buildSampleDOM();
    assert.strictEqual(doc.getElementsByTagName("span").length, 1);
    assert.strictEqual(root.getElementsByClassName("note").length, 1);
  });

  it("walks nested descendants for traversal-based queries", () => {
    const { doc, root } = buildSampleDOM();
    const wrapper = doc.createElement("section");
    const inner = doc.createElement("div");
    const deep = doc.createElement("span");
    deep.className = "note deep";
    deep.id = "deep-node";
    inner.appendChild(deep);
    wrapper.appendChild(inner);
    root.appendChild(wrapper);

    assert.strictEqual(root.getElementsByTagName("span").length, 2);
    assert.strictEqual(root.getElementsByClassName("note").length, 2);
    assert.strictEqual(root.getElementsByClassName("note deep").length, 1);
    assert.strictEqual(root.getElementById("deep-node"), deep);
  });

  it("queries elements by namespace", () => {
    const { doc } = buildSampleDOM();
    const list = doc.getElementsByTagNameNS("*", "span");
    assert.strictEqual(list.length, 1);
  });

  it("getElementById only matches id", () => {
    const { doc, root } = buildSampleDOM();
    const input = doc.createElement("input");
    input.setAttribute("name", "login");
    root.appendChild(input);

    assert.strictEqual(root.getElementById("login"), null);
    input.id = "login";
    assert.strictEqual(root.getElementById("login"), input);
  });
});
