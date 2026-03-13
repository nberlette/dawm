import assert from "node:assert";
import { describe, it } from "node:test";
import { isNodeLike, NodeType } from "../../src/core/types.ts";

describe("core/types", () => {
  it("detects node-like values", () => {
    assert.ok(isNodeLike({ nodeType: NodeType.Element }));
    assert.ok(!isNodeLike({ nodeType: "x" }));
  });
});
