import {
  _,
  ArrayPrototypeFilter,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypePush,
  FunctionPrototypeBind,
  FunctionPrototypeCall,
  getListOwner,
  getListStorage,
  isFunction,
  isIdentifier,
  isString,
  LIST_OWNERS,
  LIST_STORAGE,
  Number,
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptors,
  PROXIED_METHODS,
  PROXY_TARGET,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  setListMeta,
  StringPrototypeToLowerCase,
  SymbolIterator,
  SymbolToStringTag,
  WeakMap as $WeakMap,
  WeakMapPrototypeGetOrInsertComputed,
  WeakMapPrototypeSet,
  WeakRef as $WeakRef,
} from "dawm-internal/collections/common";
import { LinkedList } from "dawm-internal/collections/linked-list";

import type { Attr } from "dawm-core/attr";
import type { Element } from "dawm-core/element";
import { NodeType } from "dawm-core/types";
import { DOMException } from "dawm-core/dom-exception";

declare module "dawm-internal" {
  export interface NamedNodeMapInternal {
    new: (ownerElement: Element | null, attrs?: Iterable<Attr>) => NamedNodeMap;
    getOwnerElement(map: NamedNodeMap): Element | null;
    setOwnerElement(map: NamedNodeMap, element: Element | null): NamedNodeMap;
    getStorage<T extends Attr>(
      map: NamedNodeMap,
      createIfMissing?: boolean,
    ): LinkedList<T>;
    setStorage<T extends Attr>(
      map: NamedNodeMap,
      storage: LinkedList<T>,
    ): NamedNodeMap;

    wrap(
      map: NamedNodeMap,
      ownerElement?: Element | null,
      attrs?: Iterable<Attr>,
    ): NamedNodeMap;
  }

  export interface internal {
    NamedNodeMap: NamedNodeMapInternal;
  }
}

/**
 * Represents a map of {@linkcode Attr} objects that can be accessed by name.
 *
 * @category Collections
 * @tags NamedNodeMap
 */
export class NamedNodeMap {
  [index: number]: Attr;
  [key: string]: unknown;

  constructor() {
    _.enforcePrivateConstructor({ arguments });
    _.webidl.createBranded(this);
  }

  get length(): number {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    return _.NamedNodeMap.getStorage(this).length;
  }

  set length(value: number) {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const list = _.NamedNodeMap.getStorage(this);
    list.length = value;
  }

  item(index: number): Attr | null {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    return _.NamedNodeMap.getStorage(this).at(index);
  }

  getNamedItem(name: string): Attr | null {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    for (let i = 0; i < this.length; i++) {
      const attr = this.item(i);
      if (!attr?.name) continue;
      const n = attr.name;
      if (StringPrototypeToLowerCase(n) === StringPrototypeToLowerCase(name)) {
        return attr;
      }
    }
    return null;
  }

  getNamedItemNS(namespace: string | null, localName: string): Attr | null {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    for (let i = 0; i < this.length; i++) {
      const attr = this.item(i);
      if (!attr) continue;
      if (attr.localName === localName && attr.namespaceURI === namespace) {
        return attr;
      }
    }
    return null;
  }

  setNamedItem(attr: Attr): Attr | null {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const existing = this.getNamedItem(attr.name);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      _.NamedNodeMap.getStorage(this).splice(index, 1, attr);
    } else {
      _.NamedNodeMap.getStorage(this).append(attr);
    }
    return existing;
  }

  setNamedItemNS(attr: Attr): Attr | null {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const existing = this.getNamedItemNS(attr.namespaceURI, attr.localName);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      _.NamedNodeMap.getStorage(this).splice(index, 1, attr);
    } else {
      _.NamedNodeMap.getStorage(this).append(attr);
    }
    return existing;
  }

  removeNamedItem(name: string): Attr {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const existing = this.getNamedItem(name);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      _.NamedNodeMap.getStorage(this).splice(index, 1);
      return existing;
    } else {
      throw new DOMException(
        `Attribute with name "${name}" not found.`,
        "NotFoundError",
      );
    }
  }

  removeNamedItemNS(namespace: string | null, localName: string): Attr {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const existing = this.getNamedItemNS(namespace, localName);
    if (existing) {
      let index = 0;
      for (; index < this.length; index++) {
        if (this.item(index) === existing) break;
      }
      _.NamedNodeMap.getStorage(this).splice(index, 1);
      return existing;
    } else {
      throw new DOMException(
        `Attribute with local name "${localName}" and namespace "${namespace}" not found.`,
        "NotFoundError",
      );
    }
  }

  *keys(): IterableIterator<number> {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    for (let i = 0; i < this.length; i++) yield i;
  }

  *values(): IterableIterator<Attr> {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    return yield* getListStorage<Attr>(this);
  }

  *entries(): IterableIterator<[number, Attr]> {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    const list = _.NamedNodeMap.getStorage(this);
    for (let i = 0, n = list.head; n; n = n.next, i++) yield [i, n.value];
  }

  forEach<This = undefined>(
    callback: (
      this: This,
      node: Attr,
      index: number,
      list: NamedNodeMap,
    ) => void,
    thisArg?: This,
  ): void {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    for (let i = 0; i < this.length; i++) {
      const node = this.item(i)!;
      FunctionPrototypeCall(callback, thisArg!, node, i, this);
    }
  }

  *[SymbolIterator](): IterableIterator<Attr> {
    _.webidl.assertBranded(this, NamedNodeMapPrototype);
    return yield* _.NamedNodeMap.getStorage(this);
  }

  declare readonly [SymbolToStringTag]: "NamedNodeMap";

  static {
    _.toStringTag("NamedNodeMap")(this);
    _.NamedNodeMap = {
      new: (ownerElement, attrs) => {
        const map = new (NamedNodeMap as any)(_.keys._private);
        return _.NamedNodeMap.wrap(map, ownerElement, attrs);
      },
      getOwnerElement: (map) => {
        const node = getListOwner(map);
        if (node && node.nodeType === NodeType.Element) {
          return node as Element;
        }
        return null;
      },
      setOwnerElement: (map, element) => {
        if (element && element.nodeType !== NodeType.Element) {
          throw new DOMException(
            "Failed to set owner element: provided value is not an Element.",
            "InvalidNodeTypeError",
          );
        }
        setListMeta(map, undefined, element);
        return map;
      },
      getStorage: (map, createIfMissing = false) => {
        let storage = WeakMapPrototypeGetOrInsertComputed(
          LIST_STORAGE,
          map,
          () => (createIfMissing ? new LinkedList() : null),
        );
        if (!storage && createIfMissing) {
          storage = new LinkedList();
          WeakMapPrototypeSet(LIST_STORAGE, map, storage);
        }
        return storage as never;
      },
      setStorage: (map, storage) => {
        return WeakMapPrototypeSet(LIST_STORAGE, map, storage), map;
      },
      wrap: (map, ownerElement, attrs) => {
        ownerElement ??= _.NamedNodeMap.getOwnerElement(map);
        attrs ??= [];
        const storage = _.NamedNodeMap.getStorage(map, true);

        const proxy = new Proxy(map, {
          get: (t, p) => {
            if (p === "constructor") return NamedNodeMap;
            if (p === "length") return storage.length;
            if (p === SymbolToStringTag) return "NamedNodeMap";
            if (p === SymbolIterator) p = "values";
            if (p === PROXY_TARGET) return t;
            const cache = WeakMapPrototypeGetOrInsertComputed(
              PROXIED_METHODS,
              t,
              () => new $WeakMap(),
            );
            if (ReflectHas(t, p)) {
              const v = ReflectGet(t, p);
              if (isFunction(v)) {
                return WeakMapPrototypeGetOrInsertComputed(
                  cache,
                  v,
                  () =>
                    ObjectDefineProperties(
                      FunctionPrototypeBind(v, t),
                      ObjectGetOwnPropertyDescriptors(v),
                    ),
                );
              }
              return v;
            } else if (isString(p)) {
              const index = Number(p);
              if (index === (index | 0) && index >= 0) {
                return storage.at(index);
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
                a = storage.at(index);
              } else {
                a = t.getNamedItem(p);
              }
              if (a) {
                a.value = v.nodeType === NodeType.Attribute
                  ? v.value
                  : String(v);
              }
              return true;
            }
            return ReflectSet(t, p, v);
          },
          has: (t, p) => {
            if (isString(p)) {
              const index = Number(p);
              if (index === (index | 0) && index >= 0) {
                return storage.at(index) !== null;
              }
              return t.getNamedItem(p) !== null;
            }
            return ReflectHas(t, p);
          },
          ownKeys: (t) => {
            const keys = ReflectOwnKeys(t);
            for (let i = 0; i < t.length; i++) {
              const attr = t[i];
              if (!attr?.name) continue;
              if (
                isIdentifier(attr.name) &&
                !ArrayPrototypeIncludes(keys, attr.name)
              ) ArrayPrototypePush(keys, attr.name);
              ArrayPrototypePush(keys, String(i));
            }

            // deduplicate keys, just in case
            return ArrayPrototypeFilter(
              keys,
              (k, i, a) => ArrayPrototypeIndexOf(a, k) === i,
            );
          },
          getOwnPropertyDescriptor: (t, p) => {
            if (isString(p)) {
              let value: Attr | null = null;
              const index = Number(p);
              if (index === (index | 0) && index >= 0) {
                value = storage.at(index);
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

        const list = new LinkedList(...attrs);
        WeakMapPrototypeSet(LIST_STORAGE, proxy, list);
        WeakMapPrototypeSet(LIST_STORAGE, map, list);
        return proxy;
      },
    };
  }
}

const NamedNodeMapPrototype = _.primordials.ObjectFreeze(
  NamedNodeMap.prototype,
);

/**
 * Creates a new {@linkcode NamedNodeMap} object from a given {@linkcode owner}
 * element and an iterable of {@linkcode Attr} nodes.
 *
 * @param owner The owner element of the NamedNodeMap.
 * @param attrs An iterable of Attr nodes to include in the NamedNodeMap.
 * @returns A new (live) NamedNodeMap instance.
 * @category Collections
 * @tags NamedNodeMap, Factory
 */
export function createNamedNodeMap(
  ownerElement: Element,
  attributes: Iterable<Attr>,
): NamedNodeMap {
  return _.NamedNodeMap.new(ownerElement, attributes);
}
