import assert from "node:assert";
import { describe, it } from "node:test";
import { CDATASection } from "../../src/core/CDATASection.ts";
import { NodeType } from "../../src/core/types.ts";

describe("core/CDATASection", () => {
  it("exposes nodeType and clones", () => {
    const c = new CDATASection("data");
    assert.strictEqual(c.nodeType, NodeType.CDATASection);
    const clone = c.cloneNode();
    assert.strictEqual(clone.data, "data");
  });
});
