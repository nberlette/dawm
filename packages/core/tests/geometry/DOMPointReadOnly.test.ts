import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMPointReadOnly } from "../../src/geometry/DOMPointReadOnly.ts";

describe("geometry/DOMPointReadOnly", () => {
  it("defaults and serializes", () => {
    const p = new DOMPointReadOnly();
    assert.deepStrictEqual(p.toJSON(), { x: 0, y: 0, z: 0, w: 1 });
  });

  it("fromPoint preserves values", () => {
    const p = DOMPointReadOnly.fromPoint({ x: 1, y: 2, z: 3, w: 4 });
    assert.strictEqual(p.x, 1);
    assert.strictEqual(p.w, 4);
  });
});
