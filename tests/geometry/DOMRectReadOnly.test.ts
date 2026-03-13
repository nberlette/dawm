import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMRectReadOnly } from "../../src/geometry/DOMRectReadOnly.ts";

describe("geometry/DOMRectReadOnly", () => {
  it("computes edges", () => {
    const r = new DOMRectReadOnly(10, 20, 30, 40);
    assert.strictEqual(r.left, 10);
    assert.strictEqual(r.right, 40);
    assert.strictEqual(r.bottom, 60);
  });
});
