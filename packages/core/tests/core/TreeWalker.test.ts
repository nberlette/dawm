import assert from "node:assert";
import { describe, it } from "node:test";
import { NodeFilter } from "../../src/NodeFilter.ts";
import { buildSampleDOM } from "dawm-testing/utils";

describe("core/TreeWalker", () => {
  it("walks sibling nodes", () => {
    const { doc, root } = buildSampleDOM();
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ALL);
    const first = walker.firstChild();
    assert.ok(first);
    const next = walker.nextSibling();
    assert.ok(next);
  });

  it("throws when detached", () => {
    const { doc, root } = buildSampleDOM();
    const walker = doc.createTreeWalker(root);
    walker.detach();
    assert.throws(() => walker.nextNode(), /detached/);
  });
});
