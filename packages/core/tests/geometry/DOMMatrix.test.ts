import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMMatrix } from "../../src/geometry/DOMMatrix.ts";

describe("geometry/DOMMatrix", () => {
  it("allows setting components", () => {
    const m = new DOMMatrix();
    m.a = 2;
    m.f = 10;
    assert.strictEqual(m.a, 2);
    assert.strictEqual(m.f, 10);
  });
});
