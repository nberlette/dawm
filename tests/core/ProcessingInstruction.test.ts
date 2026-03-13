import assert from "node:assert";
import { describe, it } from "node:test";
import { ProcessingInstruction } from "../../src/core/ProcessingInstruction.ts";
import { NodeType } from "../../src/core/types.ts";

describe("core/ProcessingInstruction", () => {
  it("exposes target/data", () => {
    const pi = new ProcessingInstruction("target", "data");
    assert.strictEqual(pi.nodeType, NodeType.ProcessingInstruction);
    assert.strictEqual(pi.target, "target");
    assert.strictEqual(pi.data, "data");
  });
});
