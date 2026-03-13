import assert from "node:assert";
import { describe, it } from "node:test";
import {
  IndexedCollection,
  type IndexedCollectionOptions,
} from "../../src/collections/IndexedCollection.ts";
import { _, isPlainObject } from "../../src/_internal.ts";

describe("collections/IndexedCollection", () => {
  describe("structure", () => {
    it("is a class constructor", () => {
      assert.strictEqual(typeof IndexedCollection, "function");
    });
    it("is abstract and cannot be instantiated directly", () => {
      assert.throws(() => {
        // @ts-expect-error -- this is intentional, for testing
        return new IndexedCollection();
      }, TypeError);
    });
    it("should allow subclassing", () => {
      class SubCollection extends IndexedCollection<number> {}
      const instance = new SubCollection();
      assert.ok(instance instanceof SubCollection);
    });
  });

  describe("behavior", () => {
    class NumberCollection extends IndexedCollection<number> {
      [key: string]: unknown;

      constructor(
        items: Iterable<number> | ArrayLike<number> = [],
        options?: IndexedCollectionOptions<number>,
      ) {
        super(items, options);
      }
    }

    it("supports indexed access for static collections", () => {
      const list = new NumberCollection([1, 2]);
      const mutable = list as any;
      assert.strictEqual(list.length, 2);
      assert.strictEqual(list.item(0), 1);
      assert.strictEqual(list[1], 2);

      mutable[2] = 3;
      assert.strictEqual(list.length, 3);
      assert.strictEqual(list.item(2), 3);
      assert.ok("2" in list);

      delete mutable[1];
      assert.strictEqual(list.length, 2);
      assert.strictEqual(list.item(1), 3);

      (list as { length: number }).length = 1;
      assert.strictEqual(list.length, 1);
      assert.deepStrictEqual(Array.from(list.values()), [1]);
    });

    it("refreshes from live list getters", () => {
      const source = [10, 20];
      const list = new NumberCollection([], {
        getItems: () => source,
      });

      assert.deepStrictEqual(Array.from(list), [10, 20]);

      source.push(30);
      assert.strictEqual(list.length, 3);
      assert.strictEqual(list.item(2), 30);

      source.shift();
      assert.deepStrictEqual(Array.from(list.values()), [20, 30]);
    });

    it("supports gated and normalized dynamic key access", () => {
      const store = new Map<string, number>([
        ["foo", 1],
        ["bar", 2],
      ]);

      const list = new NumberCollection([99], {
        access: {
          isValidKey: (key) => key.startsWith("$"),
          normalizeKey: (key) => key.slice(1).toLowerCase(),
          get: (key) => store.get(key),
          has: (key) => store.has(key),
          ownKeys: () => ["$foo", "$bar"],
          set: (key, value) => (store.set(key, Number(value)), true),
          delete: (key) => store.delete(key),
        },
      });

      assert.strictEqual((list as any).$FOO, 1);
      assert.strictEqual((list as any).foo, undefined);
      assert.ok("$foo" in list);
      assert.ok("$FOO" in list);
      assert.ok(!("foo" in list));

      list.$BAR = 7;
      assert.strictEqual((list as any).$bar, 7);

      const desc = Object.getOwnPropertyDescriptor(list, "$FOO");
      assert.strictEqual(desc?.value, 1);
      assert.strictEqual(desc?.enumerable, true);

      const keys = Reflect.ownKeys(list);
      assert.ok(keys.includes("$foo"));
      assert.ok(keys.includes("0"));
      assert.ok(keys.includes("length"));

      delete (list as any).$foo;
      assert.strictEqual((list as any).$foo, undefined);
    });
  });
});

describe("[internal] _.IndexedCollection", () => {
  it("should exist in the internal _ namespace", () => {
    assert.strict(isPlainObject(_.IndexedCollection));
  });

  it("should have the expected internal structure", () => {
    const expectedMethods = [
      "getItems",
      "setItems",
      "getLiveGetter",
      "setLiveGetter",
      "refresh",
      "getAccess",
      "setAccess",
    ] as const;

    for (const method of expectedMethods) {
      assert.strict(
        method in _.IndexedCollection &&
          typeof _.IndexedCollection[method] === "function",
        `_.IndexedCollection should have a method named ${method}`,
      );
    }
  });
});
