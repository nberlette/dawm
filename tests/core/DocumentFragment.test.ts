import assert from "node:assert";
import { describe, it } from "node:test";
import { DocumentFragment } from "../../src/core/DocumentFragment.ts";
import { Element } from "../../src/core/Element.ts";

describe("core/DocumentFragment", () => {
  it("collects elements by name", () => {
    const frag = new DocumentFragment();
    const el = new Element("div");
    el.setAttribute("name", "target");
    frag.appendChild(el);
    const matches = frag.getElementsByName("target");
    assert.strictEqual(matches.length, 1);
  });

  it("clones deep", () => {
    const frag = new DocumentFragment();
    const el = new Element("div");
    frag.appendChild(el);
    const clone = frag.cloneNode(true);
    assert.strictEqual(clone.childNodes.length, 1);
  });
});
