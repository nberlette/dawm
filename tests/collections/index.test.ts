import assert from "node:assert";
import { describe, it } from "node:test";
import * as mod from "../../src/collections/index.ts";

describe("collections/index", () => {
  it("loads", () => {
    assert.ok(mod && typeof mod === "object");
  });

  it("exports are defined", () => {
    for (const [key, value] of Object.entries(mod)) {
      assert.notStrictEqual(value, undefined, key + " is undefined");
    }
  });
});
