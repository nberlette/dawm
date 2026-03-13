import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMRect } from "../../src/geometry/DOMRect.ts";

describe("geometry/DOMRect", () => {
  it("is mutable", () => {
    const r = new DOMRect(0, 0, 1, 2);
    r.width = 10;
    r.height = 5;
    assert.strictEqual(r.width, 10);
    assert.strictEqual(r.height, 5);
  });
});
