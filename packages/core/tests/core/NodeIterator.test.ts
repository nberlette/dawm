import assert from "node:assert";
import { describe, it } from "node:test";
import type { Element } from "../../src/Element.ts";
import { NodeFilter } from "../../src/NodeFilter.ts";
import { buildSampleDOM } from "../../../../test-support/_utils.ts";

describe("core/NodeIterator", () => {
  it("iterates nodes with filters", () => {
    const { doc, root } = buildSampleDOM();
    const iter = doc.createNodeIterator(root, NodeFilter.SHOW_ALL, (n) => {
      return (n as Element).tagName.toLowerCase() === "span"
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    });
    const node = iter.nextNode();
    assert.ok(node);
    assert.strictEqual((node as Element).tagName.toLowerCase(), "span");
  });

  it("throws when detached", () => {
    const { doc, root } = buildSampleDOM();
    const iter = doc.createNodeIterator(root);
    iter.detach();
    assert.throws(() => iter.nextNode(), /detached/);
  });
});
