import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMMatrixReadOnly } from "../../src/geometry/DOMMatrixReadOnly.ts";

describe("geometry/DOMMatrixReadOnly", () => {
  it("constructs identity by default", () => {
    const m = new DOMMatrixReadOnly();
    assert.strictEqual(m.isIdentity, true);
  });

  it("fromFloat32Array validates input", () => {
    assert.throws(() =>
      (DOMMatrixReadOnly as any).fromFloat32Array([1, 0, 0, 1])
    );
    const m = DOMMatrixReadOnly.fromFloat32Array(
      new Float32Array([1, 0, 0, 1, 0, 0]),
    );
    assert.ok(m);
  });
});
