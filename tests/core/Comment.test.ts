import assert from "node:assert";
import { describe, it } from "node:test";
import { Comment } from "../../src/core/Comment.ts";
import { NodeType } from "../../src/core/types.ts";

describe("core/Comment", () => {
  it("exposes nodeType and clones", () => {
    const c = new Comment("hello");
    assert.strictEqual(c.nodeType, NodeType.Comment);
    const clone = c.cloneNode();
    assert.strictEqual(clone.data, "hello");
  });
});
