import { isFunction, isNumber, isString } from "../_internal.ts";
import type { Element } from "../core/Element.ts";
import {
  Number,
  ObjectDefineProperty,
  ReflectDefineProperty,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  WeakRef as $WeakRef,
} from "../internal/primordials.ts";
import {
  deleteListIndex,
  indexOfInList,
  LinkedList,
  LIST_OWNERS,
  LIST_STORAGE,
  OwnerElement,
  PROXY_TARGET,
  refreshList,
  setListIndex,
  setListMeta,
  toArrayIndex,
  trimList,
} from "./_common.ts";

/**
 * Represents a live HTMLCollection as defined by the DOM Standard, which is an
 * array-like object that represents a collection of {@linkcode Element}s in an
 * HTML document. This is a living collection, meaning it updates automatically
 * when the document structure changes.
 *
 * @category Collections
 * @tags HTMLCollection
 */
export class HTMLCollection {
  [index: number]: Element;

  constructor(
    owner?: OwnerElement | null,
    nodes?: Iterable<Element>,
    getItems?: (() => Element[]) | null,
  ) {
    if (owner) LIST_OWNERS.set(this, new $WeakRef(owner));
    const storage = LIST_STORAGE;

    const proxy = new Proxy(this, {
      get: (t, p, r) => {
        if (p === "constructor") return HTMLCollection;
        if (p === Symbol.toStringTag) return "HTMLCollection";
        if (p === "length") return refreshList(t).length;
        if (p === Symbol.iterator) {
          return function* () {
            const list = refreshList(t);
            for (let i = 0; i < list.length; i++) yield list.at(i);
          };
        }
        if (ReflectHas(t, p)) {
          const v = ReflectGet(t, p, r);
          return isFunction(v) ? v.bind(t) : v;
        } else if (isString(p)) {
          const index = toArrayIndex(p);
          if (index !== null) return refreshList(t).at(index);
          const namedItem = t.namedItem(p);
          if (namedItem) return namedItem;
        }
        return ReflectGet(t, p);
      },
      has: (t, p) => {
        if (isString(p)) {
          const index = toArrayIndex(p);
          if (index !== null) return refreshList(t).at(index) !== null;
          if (t.namedItem(p)) return true;
        }
        return ReflectHas(t, p);
      },
      set: (t, p, v, r) => {
        if (p === "length") {
          trimList(t, Number(v));
          return true;
        }
        if (isString(p)) {
          const index = toArrayIndex(p);
          if (index !== null) {
            setListIndex(t, index, v as Element);
            return true;
          }
          const namedItem = t.namedItem(p);
          if (namedItem) {
            const list = refreshList(t);
            const nodeIndex = indexOfInList(list, namedItem);
            if (nodeIndex !== -1) {
              setListIndex(t, nodeIndex, v as Element);
              return true;
            }
          }
        }
        return ReflectSet(t, p, v, r);
      },
      deleteProperty: (t, p) => {
        if (isString(p)) {
          const index = toArrayIndex(p);
          if (index !== null) {
            deleteListIndex(t, index);
            return true;
          }
          const namedItem = t.namedItem(p);
          if (namedItem) {
            const list = refreshList(t);
            const nodeIndex = indexOfInList(list, namedItem);
            if (nodeIndex !== -1) {
              deleteListIndex(t, nodeIndex);
              return true;
            }
          }
        }
        return ReflectDeleteProperty(t, p);
      },
      ownKeys: (t) => {
        const list = refreshList(t);
        const keys = ReflectOwnKeys(t) as (string | symbol)[];

        if (list.length) {
          for (let i = 0; i < list.length; i++) {
            const item = list.at(i)!;
            if (item.id && !keys.includes(item.id)) {
              keys.push(item.id);
            } else if (item.hasAttribute("name")) {
              const name = item.getAttribute("name")!;
              if (!keys.includes(name)) keys.push(name);
            }
            if (!keys.includes(String(i))) keys.push(String(i));
          }
        }
        return [...new Set(keys).add("length")];
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p)) {
          let value: Element | undefined;
          const index = toArrayIndex(p);
          if (index !== null) value = refreshList(t).at(index) ?? undefined;
          if (!value) {
            const namedItem = t.namedItem(p);
            if (namedItem) value = namedItem;
          }
          if (value) {
            return {
              value,
              writable: true,
              enumerable: true,
              configurable: true,
            };
          }
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
      },
      defineProperty: (t, p, desc) => {
        const index = toArrayIndex(p);
        if (index !== null && "value" in desc) {
          setListIndex(t, index, desc.value as Element);
          return true;
        }
        if (p === "length" && "value" in desc && isNumber(desc.value)) {
          trimList(t, Number(desc.value));
          return true;
        }
        return ReflectDefineProperty(t, p, desc);
      },
      isExtensible: () => false,
      preventExtensions: () => true,
    });
    const list = new LinkedList(...nodes ?? []);
    storage.set(this, list).set(proxy, list);
    ObjectDefineProperty(proxy, PROXY_TARGET, { value: this });
    if (getItems) setListMeta(proxy, getItems, owner ?? undefined);
    else if (owner) setListMeta(proxy, null, owner);
    return proxy;
  }

  get length(): number {
    return refreshList(this).length;
  }

  item(index: number): Element | null {
    return refreshList(this).at(index);
  }

  namedItem(name: string): Element | null {
    const list = refreshList(this);
    for (let i = 0; i < list.length; i++) {
      const item = list.at(i)!;
      if (
        item.id === name || item.getAttribute("id") === name ||
        item.getAttribute("name") === name
      ) {
        return item;
      }
    }
    return null;
  }

  *[Symbol.iterator](): IterableIterator<Element> {
    return yield* refreshList(this);
  }

  declare readonly [Symbol.toStringTag]: "HTMLCollection";

  static {
    ObjectDefineProperty(this.prototype, Symbol.toStringTag, {
      value: "HTMLCollection",
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}

/**
 * Represents a typed live HTMLCollection as defined by the DOM Standard, which is
 * an array-like object that represents a collection of {@linkcode Element}s in
 * a document. This is a living collection, meaning it updates automatically when
 * the document changes.
 *
 * @see {@linkcode HTMLCollection} for the base (untyped) implementation.
 * @see {@linkcode HTMLCollectionConstructor} for the constructor interface.
 * @see {@linkcode createHTMLCollection} for a helper function to create typed
 *      HTMLCollection instances with less boilerplate.
 * @category Collections
 * @tags HTMLCollection, Typed, Live
 */
export interface HTMLCollectionOf<T extends Element> extends HTMLCollection {
  readonly [index: number]: T;
  readonly length: number;
  item(index: number): T | null;
  namedItem(name: string): T | null;
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * Constructor for {@linkcode HTMLCollection} and {@linkcode HTMLCollectionOf}
 * instances. This is an overloaded constructor: if called with adequate type
 * information, it will return a strongly-typed {@linkcode HTMLCollectionOf}
 * instance that reflect the type of elements contained in the collection.
 *
 * If the compiler is unable to infer a more specific type, however, it simply
 * returns a generic {@linkcode HTMLCollection} instead. You can also force the
 * constructor to use the typed variant by providing an explicit type argument
 * that extends the {@linkcode Element} interface.
 *
 * @category Collections
 * @tags HTMLCollection, Constructor
 */
export interface HTMLCollectionConstructor {
  new <T extends Element>(
    ownerElement?: OwnerElement | null,
    nodes?: Iterable<T>,
    getItems?: (() => T[]) | null,
  ): HTMLCollectionOf<T>;
  new (
    ownerElement?: OwnerElement | null,
    nodes?: Iterable<Element>,
    getItems?: (() => Element[]) | null,
  ): HTMLCollection;
  readonly prototype: HTMLCollection;
}

/**
 * Represents a typed live HTMLCollection as defined by the DOM Standard, which
 * is an array-like object that represents a collection of {@linkcode Element}s
 * in a document. This is a living collection, meaning it updates automatically
 * when the document changes.
 *
 * @see {@linkcode HTMLCollectionConstructor} for the constructor interface.
 * @category Collections
 * @tags HTMLCollection, Typed, Living
 */
export const HTMLCollectionOf: HTMLCollectionConstructor = HTMLCollection;

/**
 * Creates a typed live {@linkcode HTMLCollection} instance from a given owner
 * element and a "snapshot" function that retrieves the current set of elements
 * it should contain. The returned collection is live, meaning its elements are
 * updated automatically to reflect its element's current state in the DOM.
 *
 * @category Collections
 * @tags HTMLCollection, Factory, Live
 */
export function createHTMLCollection<T extends Element>(
  owner: OwnerElement,
  getItems: () => T[],
  _name?: string,
): HTMLCollectionOf<T> {
  return new HTMLCollectionOf<T>(owner, getItems(), getItems);
}
