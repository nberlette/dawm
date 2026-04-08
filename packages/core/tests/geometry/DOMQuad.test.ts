import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMQuad } from "../../src/geometry/DOMQuad.ts";

describe("geometry/DOMQuad", () => {
  it("builds from rect and computes bounds", () => {
    const quad = DOMQuad.fromRect({ x: 0, y: 0, width: 10, height: 5 });
    const bounds = quad.getBounds();
    assert.strictEqual(bounds.width, 10);
    assert.strictEqual(bounds.height, 5);
  });
});
