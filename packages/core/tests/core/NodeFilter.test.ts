import assert from "node:assert";
import { describe, it } from "node:test";
import { NodeFilter } from "../../src/NodeFilter.ts";

describe("core/NodeFilter", () => {
  it("exposes constants", () => {
    assert.strictEqual(NodeFilter.FILTER_ACCEPT, 1);
    assert.ok(NodeFilter.SHOW_ELEMENT > 0);
  });
});
