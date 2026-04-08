import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMPoint } from "../../src/geometry/DOMPoint.ts";

describe("geometry/DOMPoint", () => {
  it("is mutable", () => {
    const p = new DOMPoint(1, 2, 0, 1);
    p.x = 5;
    p.y = -1;
    assert.strictEqual(p.x, 5);
    assert.strictEqual(p.y, -1);
  });
});
