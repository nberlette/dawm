import { isFunction, isIdentifier, isString } from "../_internal.ts";
import type { Attr } from "../core/Attr.ts";
import type { Element } from "../core/Element.ts";
import {
  FunctionPrototypeCall,
  Number,
  ObjectDefineProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
} from "../internal/primordials.ts";
import { NodeType } from "../wasm.ts";
import { getListStorage, LinkedList, LIST_STORAGE } from "./_common.ts";

/**
 * Represents a map of {@linkcode Attr} objects that can be accessed by name.
 *
 * @category Collections
 * @tags NamedNodeMap
 */
export class NamedNodeMap {
  [index: number]: Attr;
  [key: string]: unknown;

  constructor(ownerElement: Element | null, attrs?: Iterable<Attr>) {
    const storage = LIST_STORAGE;
    if (ownerElement) {
      // storage = LIST_STORAGE.get(ownerElement);
      // if (!storage) LIST_STORAGE.set(ownerElement, storage = new $WeakMap());
    }

    const proxy = new Proxy(this, {
      get: (t, p) => {
        if (p === "constructor") return NamedNodeMap;
        if (p === Symbol.toStringTag) return "NamedNodeMap";
        if (p === "length") return getListStorage(t).length;
        if (p === Symbol.iterator) {
          return function* () {
            const list = getListStorage(t);
            for (let i = 0; i < list.length; i++) yield list.at(i);
          };
        }
        if (ReflectHas(t, p)) {
          const v = ReflectGet(t, p);
          return isFunction(v) ? v.bind(t) : v;
        } else if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index);
          }
          return t.getNamedItem(p);
        }
        return undefined;
      },
      set: (t, p, v) => {
        if (isString(p)) {
          const index = Number(p);
          let a: Attr | null;
          if (index === (index | 0) && index >= 0) {
            a = getListStorage<Attr>(t).at(index);
          } else {
            a = t.getNamedItem(p);
          }
          if (a) {
            a.value = v.nodeType === NodeType.Attribute ? v.value : String(v);
          }
          return true;
        }
        return ReflectSet(t, p, v);
      },
      has: (t, p) => {
        if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index) !== null;
          }
          return t.getNamedItem(p) !== null;
        }
        return ReflectHas(t, p);
      },
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);

        if (t.length) {
          for (let i = 0; i < t.length; i++) {
            const attr = t[i];
            if (!attr?.name) continue;
            if (isIdentifier(attr.name) && !keys.includes(attr.name)) {
              keys.push(attr.name);
            }
            keys.push(String(i));
          }
        }
        return [...new Set(keys).add("length")];
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p)) {
          let value: Attr | null = null;
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            value = getListStorage<Attr>(t).at(index);
          } else {
            value = t.getNamedItem(p) ?? null;
          }
          if (value) {
            return {
              value,
              writable: false,
              enumerable: true,
              configurable: true,
            };
          }
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
      },
    });

    const list = new LinkedList(...attrs ?? []);
    return storage.set(this, list).set(proxy, list), proxy;
  }

  get length(): number {
    return getListStorage(this).length;
  }

  set length(value: number) {
    const list = getListStorage(this);
    list.length = value;
  }

  item(index: number): Attr | null {
    return getListStorage<Attr>(this).at(index);
  }

  namedItem(name: string): Attr | null {
    for (const attr of this) {
      if (attr.name.toLowerCase() === name.toLowerCase()) return attr;
    }
    return null;
  }

  getNamedItem(name: string): Attr | null {
    return this.namedItem(name);
  }

  getNamedItemNS(namespace: string | null, localName: string): Attr | null {
    for (const attr of this) {
      if (attr.localName === localName && attr.namespaceURI === namespace) {
        return attr;
      }
    }
    return null;
  }

  setNamedItem(attr: Attr): Attr | null {
    const existing = this.getNamedItem(attr.name);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      getListStorage(this).splice(index, 1, attr);
    } else {
      getListStorage(this).append(attr);
    }
    return existing;
  }

  setNamedItemNS(attr: Attr): Attr | null {
    const existing = this.getNamedItemNS(attr.namespaceURI, attr.localName);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      getListStorage(this).splice(index, 1, attr);
    } else {
      getListStorage(this).append(attr);
    }
    return existing;
  }

  removeNamedItem(name: string): Attr {
    const existing = this.getNamedItem(name);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      getListStorage(this).splice(index, 1);
      return existing;
    } else {
      throw new DOMException(
        `Attribute with name "${name}" not found.`,
        "NotFoundError",
      );
    }
  }

  removeNamedItemNS(namespace: string | null, localName: string): Attr {
    const existing = this.getNamedItemNS(namespace, localName);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      getListStorage(this).splice(index, 1);
      return existing;
    } else {
      throw new DOMException(
        `Attribute with local name "${localName}" and namespace "${namespace}" not found.`,
        "NotFoundError",
      );
    }
  }

  *keys(): IterableIterator<number> {
    for (let i = 0; i < this.length; i++) yield i;
  }

  *values(): IterableIterator<Attr> {
    return yield* getListStorage<Attr>(this);
  }

  *entries(): IterableIterator<[number, Attr]> {
    for (let i = 0; i < this.length; i++) {
      yield [i, this.item(i)! as Attr];
    }
  }

  forEach<This = void>(
    callback: (
      this: This,
      node: Attr,
      index: number,
      list: NamedNodeMap,
    ) => void,
    thisArg?: This,
  ): void {
    for (let i = 0; i < this.length; i++) {
      const node = this.item(i)!;
      FunctionPrototypeCall(callback, thisArg, node, i, this);
    }
  }

  *[Symbol.iterator](): IterableIterator<Attr> {
    return yield* getListStorage<Attr>(this);
  }

  declare readonly [Symbol.toStringTag]: "NamedNodeMap";

  static {
    ObjectDefineProperty(this.prototype, Symbol.toStringTag, {
      value: "NamedNodeMap",
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}
/**
 * Creates a new {@linkcode NamedNodeMap} object from a given {@linkcode owner}
 * element and an iterable of {@linkcode Attr} nodes.
 *
 * @param owner The owner element of the NamedNodeMap.
 * @param attrs An iterable of Attr nodes to include in the NamedNodeMap.
 * @returns A new NamedNodeMap instance.
 * @category Collections
 * @tags NamedNodeMap, Factory
 */

export function createNamedNodeMap(
  owner: Element,
  attrs: Iterable<Attr>,
): NamedNodeMap {
  return new NamedNodeMap(owner, attrs);
}
