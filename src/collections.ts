import {
  FunctionPrototypeCall,
  indexOf,
  isFunction,
  isString,
  Number,
  ObjectDefineProperty,
  ObjectFreeze,
  ObjectHasOwn,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  StringPrototypeReplace,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
  uncurryThis,
  WeakMap,
  WeakRef,
} from "./_internal.ts";
import {
  type Attr,
  type Document,
  type DocumentFragment,
  type Element,
  type Node,
  NodeType,
} from "./dom.ts";

// #region internal

class LinkedNode<T> {
  value: T;
  next: LinkedNode<T> | null = null;
  prev: LinkedNode<T> | null = null;

  constructor(
    value: T,
    prev: LinkedNode<T> | null = null,
    next: LinkedNode<T> | null = null,
  ) {
    this.value = value;
    this.prev = prev;
    this.next = next;
  }
}

class LinkedList<T> implements Iterable<T> {
  head: LinkedNode<T> | null = null;
  tail: LinkedNode<T> | null = null;
  length: number = 0;

  constructor(...items: T[]) {
    this.append(...items);
  }

  append(...items: T[]): this {
    for (const item of items) {
      const node = new LinkedNode(item, this.tail, null);
      if (this.tail) this.tail.next = node;
      this.tail = node;
      if (!this.head) this.head = node;
      this.length++;
    }
    return this;
  }

  prepend(...items: T[]): this {
    for (const item of items) {
      const node = new LinkedNode(item, null, this.head);
      if (this.head) this.head.prev = node;
      this.head = node;
      if (!this.tail) this.tail = node;
      this.length++;
    }
    return this;
  }

  splice(start: number, deleteCount: number, ...items: T[]): T[] {
    if (start < 0 || start >= this.length || deleteCount < 0) {
      throw new RangeError("Index out of bounds");
    }

    const removed: T[] = [];
    for (
      let i = 0, current = this.item(start);
      i < deleteCount && current;
      (current = current?.next ?? null), i++
    ) {
      removed.push(current.value);
      const { prev, next } = current;
      if (prev) prev.next = next;
      if (next) next.prev = prev;
      if (current === this.head) this.head = next;
      if (current === this.tail) this.tail = prev;
      current = next;
      this.length--;
    }
    if (items.length) this.insertAt(start, ...items);
    return removed;
  }

  insertAt(index: number, ...items: T[]): this {
    if (index < 0 || index > this.length) {
      throw new RangeError("Index out of bounds");
    }

    for (const item of items) {
      const node = new LinkedNode(item, null, null);
      if (index === 0) {
        node.next = this.head;
        if (this.head) this.head.prev = node;
        this.head = node;
        if (!this.tail) this.tail = node;
      } else {
        const prev = this.item(index - 1);
        const next = prev?.next ?? null;
        prev!.next = node;
        node.prev = prev;
        node.next = next;
        if (next) next.prev = node;
        if (!next) this.tail = node;
      }
      this.length++;
    }
    return this;
  }

  item(index: number): LinkedNode<T> | null {
    if (index < 0 || index >= this.length) return null;
    let current = this.head;
    for (let i = 0; i < index; i++) {
      if (!current) return null;
      current = current.next;
    }
    return current;
  }

  at(index: number): T | null {
    const node = this.item(index);
    return node?.value ?? null;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    let current = this.head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

type IndexedCollection<T extends Node> =
  | NodeListOf<T>
  | HTMLCollectionOf<T & Element>
  | NamedNodeMap;

type NodeListStorage<T extends Node = Node> = WeakMap<
  IndexedCollection<T>,
  LinkedList<T>
>;

const GET_ITEMS_DATA = new WeakMap<
  IndexedCollection<Element>,
  () => Element[]
>();
const NODE_LIST_OWNERS = new WeakMap<IndexedCollection<Node>, WeakRef<Node>>();
const NODE_LIST_DATA: WeakMap<Node, NodeListStorage> = new WeakMap();
const DETACHED_DATA: NodeListStorage = new WeakMap();
const PROXY_TARGET: unique symbol = Symbol("target");

const getListStorage = <T extends Node>(
  list: IndexedCollection<T>,
  create = false,
): LinkedList<T> => {
  list = (list as any)[PROXY_TARGET] ?? list;
  const owner = NODE_LIST_OWNERS.get(list)?.deref() ?? null;
  const storage = owner ? NODE_LIST_DATA.get(owner) : DETACHED_DATA;
  let inner = storage?.get(list);
  if (!inner) {
    if (!create) throw new TypeError("Illegal invocation");
    storage?.set(list, inner = new LinkedList());
  }
  return inner as LinkedList<T>;
};

export type SnapshotType =
  | "children"
  | "childNodes"
  | "elements"
  | "elements:tagName"
  | "elements:className"
  | "elements:name"
  | "attributes";

interface DOMStringMapInternalData {
  data: Record<string, string | undefined>;
  node: OwnerElement | null;
}

class DOMStringMapInternals {
  static readonly #cache = new WeakMap<
    DOMStringMap,
    DOMStringMapInternalData
  >();

  static get(map: DOMStringMap): DOMStringMapInternalData | undefined {
    return DOMStringMapInternals.#cache.get(map);
  }

  static ensure(
    map: DOMStringMap,
    fn: (this: DOMStringMap, map: DOMStringMap) => DOMStringMapInternalData,
  ): DOMStringMapInternalData {
    let data = DOMStringMapInternals.get(map);
    if (!data) DOMStringMapInternals.#cache.set(map, data = fn.call(map, map));
    return data;
  }

  ensure(
    map: DOMStringMap,
    data: Record<string, string | undefined> = { __proto__: null! },
    node: OwnerElement | null = null,
  ): DOMStringMapInternalData {
    return DOMStringMapInternals.ensure(map, () => ({ data, node }));
  }

  has(map: DOMStringMap, k: string): boolean {
    const { data } = this.ensure(map);
    return k in data;
  }

  get(map: DOMStringMap, k: string): string | undefined {
    const { data } = this.ensure(map);
    return data[k];
  }

  set(map: DOMStringMap, k: string, v: string | null | undefined): boolean {
    const { data, node } = this.ensure(map);
    if (node) {
      const name = this.toAttrName(k);
      let attr = node.attributes?.getNamedItem(name) ?? null;
      if (!attr && node.ownerDocument) {
        attr = node.ownerDocument.createAttribute(name, v ?? "");
      }
      attr && node.attributes?.setNamedItem(attr);
    }
    data[k] = v ?? undefined;
    return true;
  }

  delete(map: DOMStringMap, k: string): boolean {
    const { data, node } = this.ensure(map);
    if (k in data && delete data[k]) {
      if (node?.attributes) {
        const name = this.toAttrName(k);
        node.attributes.removeNamedItem(name);
      }
      return true;
    }
    return false;
  }

  clear(map: DOMStringMap): void {
    const { data, node } = this.ensure(map);
    for (const key in data) {
      if (!ObjectHasOwn(data, key)) continue;
      if (delete data[key] && node?.attributes) {
        const name = this.toAttrName(key);
        try {
          node.attributes.removeNamedItem(name);
        } catch { /* ignore */ }
      }
    }
  }

  toAttrName(key: string): string {
    const name = key.replace(/((?<=^|[^A-Z])[A-Z])/g, (_, c) => `-${c}`);
    return `data-${name.toLowerCase()}`;
  }

  getNode(map: DOMStringMap): OwnerElement | null {
    return this.ensure(map).node;
  }

  setNode(map: DOMStringMap, node: OwnerElement | null): boolean {
    return this.ensure(map).node = node, true;
  }

  getData(map: DOMStringMap): Record<string, string | undefined> {
    return this.ensure(map).data;
  }

  setData(
    map: DOMStringMap,
    data: Record<string, string | undefined>,
  ): boolean {
    return this.ensure(map).data = data, true;
  }
}

const _ = {} as {
  DOMStringMap: DOMStringMapInternals;
};

// #endregion internal

// #region NodeList

/**
 * Represents a DOM NodeList as defined by the DOM Standard, which is an
 * array-like object that represents a collection of {@linkcode Node} objects.
 *
 * @category Collections
 * @tags NodeList
 */
export class NodeList {
  [index: number]: Node;

  constructor(ownerNode?: Node | null, nodes?: Iterable<Node>) {
    let storage: NodeListStorage | undefined = DETACHED_DATA;
    if (ownerNode) {
      NODE_LIST_OWNERS.set(this, new WeakRef(ownerNode));
      storage = NODE_LIST_DATA.get(ownerNode);
      if (!storage) NODE_LIST_DATA.set(ownerNode, storage = new WeakMap());
    }
    const proxy = new Proxy(this, {
      get: (t, p) => {
        if (p === PROXY_TARGET) return t;
        if (ReflectHas(t, p)) {
          return ReflectGet(t, p);
        } else if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index);
          }
        }
      },
      has: (t, p) => {
        if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index) !== null;
          }
        }
        return ReflectHas(t, p);
      },
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);
        for (let i = 0; i < t.length; i++) {
          keys.push(String(i));
        }
        if (!keys.includes("length")) keys.push("length");
        return keys;
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            const value = getListStorage(t).at(index);
            if (value !== null) {
              return {
                enumerable: true,
                configurable: true,
                writable: true,
                value,
              };
            }
          }
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
      },
    });
    const list = new LinkedList(...nodes ?? []);
    storage.set(this, list).set(proxy, list);
    return proxy;
  }

  get length(): number {
    return getListStorage(this).length;
  }

  set length(value: number) {
    const list = getListStorage(this);
    list.length = value;
  }

  item(index: number): Node | null {
    return getListStorage(this).at(index);
  }

  forEach<This = void>(
    callback: (this: This, node: Node, index: number, list: NodeList) => void,
    thisArg?: This,
  ): void {
    for (let i = 0; i < this.length; i++) {
      const node = NodeListPrototypeItem(this, i)!;
      FunctionPrototypeCall(callback, thisArg, node, i, this);
    }
  }

  *keys(): IterableIterator<number> {
    for (const v of NodeListPrototypeEntries(this)) yield v[0];
  }

  *values(): IterableIterator<Node> {
    for (const v of NodeListPrototypeEntries(this)) yield v[1];
  }

  *entries(): IterableIterator<[number, Node]> {
    for (let i = 0; i < this.length; i++) {
      yield [i, NodeListPrototypeItem(this, i)!];
    }
  }

  *[Symbol.iterator](): IterableIterator<Node> {
    return yield* NodeListPrototypeValues(this);
  }

  declare readonly [Symbol.toStringTag]: "NodeList";

  static {
    ObjectDefineProperty(this.prototype, Symbol.toStringTag, {
      value: "NodeList",
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}

const NodeListPrototype = ObjectFreeze(NodeList.prototype);
const NodeListPrototypeItem = uncurryThis(NodeListPrototype.item);
const NodeListPrototypeValues = uncurryThis(NodeListPrototype.values);
const NodeListPrototypeEntries = uncurryThis(NodeListPrototype.entries);

/**
 * Represents a typed DOM NodeList as defined by the DOM Standard, which is an
 * array-like object that represents a collection of {@linkcode Node} objects
 * of a specific type.
 *
 * @category Collections
 * @tags NodeList
 */
export interface NodeListOf<T extends Node> extends NodeList {
  readonly [index: number]: T;

  // @ts-ignore we know, it's really an accessor
  readonly length: number;

  item(index: number): T | null;
  keys(): IterableIterator<number>;
  values(): IterableIterator<T>;
  entries(): IterableIterator<[number, T]>;
  forEach<This = void>(
    callback: (this: This, node: T, index: number, list: NodeListOf<T>) => void,
    thisArg?: This,
  ): void;
  [Symbol.iterator](): IterableIterator<T>;
}

/**
 * Constructor for {@linkcode NodeList} and {@linkcode NodeListOf} instances.
 * This is an overloaded constructor: if called with adequate type information,
 * it will return a strongly-typed {@linkcode NodeListOf} instance that reflect
 * the type of nodes contained in the list.
 *
 * @category Collections
 * @tags NodeList, Constructor
 */
export interface NodeListConstructor {
  new <T extends Node>(
    ownerNode?: Node | null,
    nodes?: Iterable<T>,
  ): NodeListOf<T>;
  new (ownerNode?: Node | null, nodes?: Iterable<Node>): NodeList;
  readonly prototype: NodeList;
}

/**
 * Represents a typed DOM NodeList as defined by the DOM Standard, which is an
 * array-like object that represents a collection of {@linkcode Node} objects
 * of a specific type.
 *
 * @see {@linkcode NodeListConstructor} for the constructor interface.
 * @category Collections
 * @tags NodeList, Typed
 */
export const NodeListOf: NodeListConstructor = NodeList as never;

// #endregion NodeList

// #region HTMLCollection

export type OwnerElement = Element | Document | DocumentFragment;

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

  constructor(owner?: OwnerElement | null, nodes?: Iterable<Element>) {
    if (owner) NODE_LIST_OWNERS.set(this, new WeakRef(owner));
    const storage = owner ? NODE_LIST_DATA.get(owner)! : DETACHED_DATA;

    const proxy = new Proxy(this, {
      get: (t, p) => {
        if (p === PROXY_TARGET) return t;
        if (ReflectHas(t, p)) {
          return ReflectGet(t, p);
        } else if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index);
          }
          const namedItem = t.namedItem(p);
          if (namedItem) return namedItem;
        }
        return ReflectGet(t, p);
      },
      has: (t, p) => {
        if (isString(p)) {
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            return getListStorage(t).at(index) !== null;
          }
          const namedItem = t.namedItem(p);
          if (namedItem) return true;
        }
        return ReflectHas(t, p);
      },
      set: (t, p, v) => {
        if (isString(p)) {
          const index = Number(p);
          const list = getListStorage(t);
          let node: LinkedNode<Element> | null = null;
          if (index === (index | 0) && index >= 0) {
            node = list.item(index);
          } else if (t.namedItem(p)) {
            node = list.item(indexOf(t, t.namedItem(p)!));
          }
          if (node) {
            node.value = v;
            return true;
          }
        }
        return ReflectSet(t, p, v);
      },
      deleteProperty: (t, p) => {
        if (isString(p)) {
          const index = Number(p);
          const list = getListStorage(t);
          let nodeIndex: number | null = null;
          if (index === (index | 0) && index >= 0) {
            nodeIndex = index;
          } else if (t.namedItem(p)) {
            nodeIndex = indexOf(t, t.namedItem(p)!);
          }
          if (nodeIndex !== null) {
            list.splice(nodeIndex, 1);
            return true;
          }
        }
        return ReflectDeleteProperty(t, p);
      },
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);

        if (t.length) {
          for (let i = 0; i < t.length; i++) {
            const item = t[i];
            if (item.id && !keys.includes(item.id)) {
              keys.push(item.id);
            } else if (item.hasAttribute("name")) {
              const name = item.getAttribute("name")!;
              if (!keys.includes(name)) keys.push(name);
            }
            if (!keys.includes(String(i))) keys.push(String(i));
          }
        }
        if (!keys.includes("length")) keys.push("length");
        return keys;
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p)) {
          let value: Element | undefined;
          const index = Number(p);
          if (index === (index | 0) && index >= 0) {
            value = getListStorage(t).at(index) ?? undefined;
          }
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
      defineProperty: () => true, // no-op to prevent errors and keep readonly
      isExtensible: () => false,
      preventExtensions: () => true,
    });
    const list = new LinkedList(...nodes ?? []);
    storage.set(this, list).set(proxy, list);
    return proxy;
  }

  get length(): number {
    let count = 0;
    for (const _ of this) count++;
    return count;
  }

  item(index: number): Element | null {
    return this[index] ?? null;
  }

  namedItem(name: string): Element | null {
    for (let i = 0; i < this.length; i++) {
      const item = this[i];
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
    return yield* getListStorage(this);
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
  ): HTMLCollectionOf<T>;
  new (
    ownerElement?: OwnerElement | null,
    nodes?: Iterable<Element>,
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
  const collection = new HTMLCollectionOf<T>(owner, getItems());
  // TODO: implement live updating
  GET_ITEMS_DATA.set(collection, getItems);
  NODE_LIST_OWNERS.set(collection, new WeakRef(owner));
  let storage = NODE_LIST_DATA.get(owner);
  if (!storage) NODE_LIST_DATA.set(owner, storage = new WeakMap());
  if (!storage.has(collection)) {
    storage.set(collection, new LinkedList(...getItems()));
  }
  return collection;
}

// #endregion HTMLCollection

// #region DOMTokenList

/**
 * Represents a set of space-separated tokens, such as those found in the
 * class attribute of an HTML element.
 *
 * @category Collections
 * @tags DOMTokenList
 */
export class DOMTokenList {
  #ownerElement: Element;
  #attributeName: string;
  #tokens: string[] | null = null;
  #updating: boolean = false;

  constructor(ownerElement: Element, attributeName: string) {
    this.#ownerElement = ownerElement;
    this.#attributeName = attributeName;
    this.#updateTokens();
  }

  #updateTokens = (value?: string) => {
    if (!this.#updating) {
      this.#updating = true;
      value ??= this.#ownerElement.getAttribute(this.#attributeName) ?? "";
      this.#tokens = value.trim().split(/\s+/).filter((t) => t.length > 0);
      this.#updating = false;
    }
    return this.#tokens ??= [];
  };

  #updateAttribute = (value?: string) => {
    if (!this.#updating) {
      this.#updating = true;
      this.#ownerElement.setAttribute(
        this.#attributeName,
        value ??= this.value,
      );
      this.#updating = false;
    }
    return value;
  };

  get value(): string {
    return this.#tokens?.join(" ") ?? "";
  }

  set value(v: string) {
    this.#updateTokens(v);
    this.#updateAttribute();
  }

  get length(): number {
    return this.#tokens?.length ?? 0;
  }

  item(index: number): string | null {
    return this.#updateTokens()?.[index] ?? null;
  }

  contains(token: string): boolean {
    return this.#updateTokens()?.includes(token) ?? false;
  }

  add(...tokens: string[]): void {
    const list = this.#updateTokens();
    list.push(...tokens);
    this.#tokens = list.filter((t, i, a) => a.indexOf(t) === i);
    this.#updateAttribute();
  }

  remove(...tokens: string[]): void {
    this.#tokens = this.#updateTokens().filter((t) => !tokens.includes(t));
    this.#updateAttribute();
  }

  toggle(token: string, force?: boolean): boolean {
    const contains = this.#updateTokens()?.includes(token) ?? false;
    if (force === undefined) force = !contains;
    if (force) {
      this.add(token);
    } else {
      this.remove(token);
    }
    return !contains;
  }

  replace(oldToken: string, newToken: string): boolean {
    const tokens = this.#updateTokens();
    const index = tokens.indexOf(oldToken);
    if (index === -1) return false;
    tokens[index] = newToken;
    this.#updateAttribute();
    return true;
  }

  supports(token: string): boolean {
    return void token, true; // always true per spec
  }

  forEach<This = void>(
    callback: (
      this: This,
      token: string,
      index: number,
      list: DOMTokenList,
    ) => void,
    thisArg?: This,
  ): void {
    if (!isFunction(callback)) {
      throw new TypeError("callback is not a function");
    }
    const tokens = this.#updateTokens();
    for (let i = 0; i < tokens.length; i++) {
      FunctionPrototypeCall(callback, thisArg, tokens[i], i, this);
    }
  }

  *[Symbol.iterator](): IterableIterator<string> {
    for (const token of this.#updateTokens()) yield token;
  }

  declare readonly [Symbol.toStringTag]: "DOMTokenList";

  static {
    ObjectDefineProperty(this.prototype, Symbol.toStringTag, {
      value: "DOMTokenList",
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}

// #endregion DOMTokenList

// #region DOMStringMap

/**
 * Used by the dataset HTML attribute to represent data for custom attributes
 * added to elements.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMStringMap)
 *
 * @category Collections
 */
export class DOMStringMap {
  constructor(ownerElement?: OwnerElement | null) {
    const data: Record<string, string | undefined> = { __proto__: null! };
    if (ownerElement?.attributes) {
      for (const attr of ownerElement.attributes) {
        if (attr.name.startsWith("data-")) {
          const rhs = attr.name.slice(5);
          const key = rhs.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          data[key] = attr.value;
        }
      }
    }
    _.DOMStringMap.ensure(this, data, ownerElement);

    return new Proxy(this, {
      get: (t, p, r) =>
        ReflectHas(t, p)
          ? ReflectGet(t, p)
          : isString(p)
          ? _.DOMStringMap.get(t, p)
          : ReflectGet(t, p, r),
      has: (t, p) => isString(p) ? _.DOMStringMap.has(t, p) : ReflectHas(t, p),
      set: (t, p, v, r) =>
        isString(p) ? _.DOMStringMap.set(t, p, v) : ReflectSet(t, p, v, r),
      deleteProperty: (t, p) =>
        isString(p) ? _.DOMStringMap.delete(t, p) : ReflectDeleteProperty(t, p),
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);
        const data = _.DOMStringMap.getData(t);
        const props = Object.keys(data);
        return [...new Set([...keys, ...props])];
      },
    });
  }

  [name: string]: string | undefined;

  static {
    _.DOMStringMap = new DOMStringMapInternals();

    // ensure this class only creates plain objects
    ObjectDefineProperty(this.prototype, "constructor", { value: Object });
  }
}

/**
 * Serializes a {@linkcode DOMStringMap} into a string of HTML data attributes.
 *
 * @param dataset - The DOMStringMap to serialize.
 * @returns A string representation of the DOMStringMap as HTML data attributes.
 * @category Collections
 * @tags DOMStringMap, Serialization
 */
export function serializeDOMStringMap(dataset: DOMStringMap): string {
  let out = "";
  for (const k in dataset) {
    if (!ObjectHasOwn(dataset, k)) continue;
    const v = dataset[k];
    if (v == null) continue;
    let p = StringPrototypeReplace(
      k,
      /([a-z]|^)([A-Z](?![A-Z]))/g,
      (_, $1, $2) => `${$1}-${$2}`,
    );
    p = StringPrototypeToLowerCase(StringPrototypeTrim(p));
    out += ` data-${p}="${v}"`;
  }
  return out;
}

// #endregion DOMStringMap

// #region NamedNodeMap

/**
 * Represents a map of {@linkcode Attr} objects that can be accessed by name.
 *
 * @category Collections
 * @tags NamedNodeMap
 */
export class NamedNodeMap {
  [index: number]: Attr;

  constructor(ownerElement: Element | null, attrs?: Iterable<Attr>) {
    let storage: NodeListStorage | undefined = DETACHED_DATA;
    if (ownerElement) {
      storage = NODE_LIST_DATA.get(ownerElement);
      if (!storage) NODE_LIST_DATA.set(ownerElement, storage = new WeakMap());
    }

    const proxy = new Proxy(this, {
      get: (t, p) => {
        if (p === PROXY_TARGET) return t;
        if (ReflectHas(t, p)) {
          return ReflectGet(t, p);
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
            if (!keys.includes(attr.name)) keys.push(attr.name);
            if (!keys.includes(String(i))) keys.push(String(i));
          }
        }
        if (!keys.includes("length")) keys.push("length");
        return keys;
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
              enumerable: false,
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
      if (attr.name === name) return attr;
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
      const index = indexOf(this, existing);
      if (index !== -1) {
        getListStorage(this).splice(index, 1, attr);
      } else {
        return null;
      }
    } else {
      getListStorage(this).append(attr);
    }
    return existing;
  }

  setNamedItemNS(attr: Attr): Attr | null {
    const existing = this.getNamedItemNS(attr.namespaceURI, attr.localName);
    if (existing) {
      const index = indexOf(this, existing);
      if (index !== -1) {
        getListStorage(this).splice(index, 1, attr);
      } else {
        return null;
      }
    } else {
      getListStorage(this).append(attr);
    }
    return existing;
  }

  removeNamedItem(name: string): Attr {
    const existing = this.getNamedItem(name);
    if (existing) {
      const index = indexOf(this, existing);
      if (index !== -1) getListStorage(this).splice(index, 1);
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
      const index = indexOf(this, existing);
      if (index !== -1) getListStorage(this).splice(index, 1);
      return existing;
    } else {
      throw new DOMException(
        `Attribute with local name "${localName}" and namespace "${namespace}" not found.`,
        "NotFoundError",
      );
    }
  }

  *keys(): IterableIterator<number> {
    for (const v of NodeListPrototypeEntries(this)) yield v[0];
  }

  *values(): IterableIterator<Attr> {
    for (const v of NodeListPrototypeEntries(this)) yield v[1] as Attr;
  }

  *entries(): IterableIterator<[number, Attr]> {
    for (let i = 0; i < this.length; i++) {
      yield [i, NodeListPrototypeItem(this, i)! as Attr];
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
      const node = NodeListPrototypeItem(this, i)!;
      FunctionPrototypeCall(callback, thisArg, node, i, this);
    }
  }

  *[Symbol.iterator](): IterableIterator<Attr> {
    return yield* NodeListPrototypeValues(this) as IterableIterator<Attr>;
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

/**
 * Serializes a {@linkcode NamedNodeMap} into a string of HTML attributes.
 *
 * @param attrs - The NamedNodeMap to serialize.
 * @returns A string representation of the NamedNodeMap as HTML attributes.
 * @category Collections
 * @tags NamedNodeMap, Serialization
 */
export function serializeNamedNodeMap(attrs: NamedNodeMap): string {
  let out = "";
  for (const attr of attrs) {
    let { name: k, value: v } = attr;

    if (
      k === "children" || (
        !v &&
        (k === "style" || k === "class" || k === "className" || k === "id")
      )
    ) {
      continue;
    }
    if ((!v && v !== "") || v === "false") continue;
    // normalize attribute names from camelCase to kebab-case, where needed.
    if (k.startsWith("aria")) {
      k = k.replace(/^aria([A-Z]\w+)$/, "aria-$1").toLowerCase();
    } else if (k === "className" || k === "classList" || k === "class") {
      k = "class"; // normalize className/class/classList attrs
    } else if (k === "htmlFor") {
      k = "for"; // normalize htmlFor/for attrs
    } else if (k === "httpEquiv") {
      k = "http-equiv"; // normalize httpEquiv/http-equiv attrs
    } else if (k === "tabIndex") {
      k = "tabindex"; // normalize tabIndex/tabindex attrs
    } else if (k === "readOnly") {
      k = "readonly"; // normalize readOnly/readonly attrs
    } else if (k === "maxLength") {
      k = "maxlength"; // normalize maxLength/maxlength attrs
    } else {
      const kebab = StringPrototypeToLowerCase(
        StringPrototypeReplace(
          k,
          /([a-z]|^)([A-Z](?![A-Z]))/g,
          (_, $1, $2) => `${$1}-${$2}`,
        ),
      );
      if (!kebab.startsWith("aria-") && !kebab.startsWith("data-")) {
        // aria attributes should be kebab-case
        k = kebab;
      }
    }
    out += ` ${k}="${v}"`;
  }
  return out;
}

// #endregion NamedNodeMap
