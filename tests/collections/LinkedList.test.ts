import assert from "node:assert";
import { describe, it } from "node:test";
import { LinkedList } from "../../src/collections/LinkedList.ts";

describe("collections/LinkedList", () => {
  it("appends a single item", () => {
    const list = new LinkedList<number>();
    list.append(1);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list.at(0), 1);
  });

  it("inserts a single item at index 0", () => {
    const list = new LinkedList<number>();
    list.insertAt(0, 7);
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list.at(0), 7);
  });
});
