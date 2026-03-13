import assert from "node:assert";
import { describe, it } from "node:test";
import { Text } from "../../src/core/Text.ts";

describe("core/CharacterData", () => {
  it("supports data operations", () => {
    const text = new Text("hello");
    assert.strictEqual(text.substringData(1, 3), "ell");
    text.appendData("!");
    assert.strictEqual(text.data, "hello!");
    text.insertData(5, ",");
    assert.strictEqual(text.data, "hello,!");
    text.deleteData(5, 1);
    assert.strictEqual(text.data, "hello!");
    text.replaceData(0, 5, "hi");
    assert.strictEqual(text.data, "hi!");
  });
});
