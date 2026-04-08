import assert from "node:assert";
import { describe, it } from "node:test";
import { NodeList } from "../../src/collections/NodeList.ts";
import { Text } from "../../src/Text.ts";

describe("collections/NodeList", () => {
  it("supports indexing and iteration", () => {
    const a = new Text("a");
    const b = new Text("b");
    const list = new NodeList(null, [a, b]);
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list.item(1), b);

    const values = Array.from(list.values());
    assert.deepStrictEqual(values, [a, b]);
  });

  it("trims via length and supports assignment", () => {
    const a = new Text("a");
    const b = new Text("b");
    const c = new Text("c");
    const list = new NodeList(null, [a, b]);
    list.length = 1;
    assert.strictEqual(list.length, 1);
    list[1] = c;
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list.item(1), c);
  });
});
