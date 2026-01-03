import {
  FunctionPrototypeCall,
  indexOf,
  isFunction,
  isIdentifier,
  isNumber,
  isString,
  Number,
  ObjectDefineProperty,
  ObjectFreeze,
  ObjectHasOwn,
  ReflectDefineProperty,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  StringPrototypeReplace,
  StringPrototypeSplit,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
  uncurryThis,
  WeakMap as $WeakMap,
  WeakRef as $WeakRef,
} from "./_internal.ts";
import {
  type Attr,
  type Document,
  type DocumentFragment,
  type Element,
  type Node,
  NodeType,
  type ParentNode,
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

const PROXY_TARGET: unique symbol = Symbol("target");
const LIST_STORAGE: NodeListStorage = new $WeakMap();
const LIST_GETTERS: WeakMap<
  IndexedCollection<Node>,
  () => Node[]
> = new $WeakMap();
const LIST_OWNERS: WeakMap<IndexedCollection<Node>, WeakRef<Node>> =
  new $WeakMap();

const resolveProxyTarget = <T extends Node>(
  list: IndexedCollection<T>,
  // deno-lint-ignore no-explicit-any
): IndexedCollection<T> => (list as any)[PROXY_TARGET] ?? list;

const getListStorage = <T extends Node>(
  list: IndexedCollection<T>,
  create = true,
): LinkedList<T> => {
  const storage = LIST_STORAGE;
  const target = resolveProxyTarget(list);
  let inner = storage.get(target) ?? storage.get(list);
  if (!inner) {
    if (!create) throw new TypeError("Illegal invocation");
    storage.set(list, inner = new LinkedList());
    storage.set(target, inner);
  } else {
    storage.set(list, inner);
    storage.set(target, inner);
  }
  return inner as LinkedList<T>;
};

const setListMeta = <T extends Node>(
  list: IndexedCollection<T>,
  getter?: (() => T[]) | null,
  owner?: Node | null,
): void => {
  const target = resolveProxyTarget(list);
  if (getter) {
    LIST_GETTERS.set(list as IndexedCollection<Node>, getter as () => Node[]);
    LIST_GETTERS.set(target as IndexedCollection<Node>, getter as () => Node[]);
  }
  if (owner) {
    const ref = new $WeakRef(owner);
    LIST_OWNERS.set(list as IndexedCollection<Node>, ref);
    LIST_OWNERS.set(target as IndexedCollection<Node>, ref);
  }
};

const getListGetter = <T extends Node>(
  list: IndexedCollection<T>,
): (() => T[]) | undefined => {
  const target = resolveProxyTarget(list);
  return LIST_GETTERS.get(list as IndexedCollection<Node>) as (() => T[]) ??
    LIST_GETTERS.get(target as IndexedCollection<Node>) as (() => T[]) ??
    undefined;
};

const syncLinkedList = <T extends Node>(
  list: IndexedCollection<T>,
  items: Iterable<T>,
): LinkedList<T> => {
  const storage = getListStorage(list);
  storage.head = storage.tail = null;
  storage.length = 0;
  for (const item of items) storage.append(item);
  return storage;
};

const refreshList = <T extends Node>(
  list: IndexedCollection<T>,
): LinkedList<T> => {
  const getter = getListGetter(list);
  if (getter) return syncLinkedList(list, getter());
  return getListStorage(list);
};

const toArrayIndex = (p: PropertyKey): number | null => {
  if (!isString(p)) return null;
  const index = Number(p);
  return index === (index | 0) && index >= 0 ? index : null;
};

const ensureIndex = <T extends Node>(
  storage: LinkedList<T>,
  index: number,
): LinkedNode<T> => {
  while (storage.length <= index) storage.append(null as unknown as T);
  return storage.item(index)!;
};

const setListIndex = <T extends Node>(
  list: IndexedCollection<T>,
  index: number,
  value: T,
): LinkedList<T> => {
  const storage = getListStorage(list);
  const node = index < storage.length ? storage.item(index)! : ensureIndex(
    storage,
    index,
  );
  node.value = value;
  return storage;
};

const deleteListIndex = <T extends Node>(
  list: IndexedCollection<T>,
  index: number,
): LinkedList<T> => {
  const storage = getListStorage(list);
  if (index < 0 || index >= storage.length) return storage;
  const node = storage.item(index);
  if (!node) return storage;
  const { prev, next } = node;
  if (prev) prev.next = next;
  else storage.head = next;
  if (next) next.prev = prev;
  else storage.tail = prev;
  storage.length--;
  return storage;
};

const trimList = <T extends Node>(
  list: IndexedCollection<T>,
  length: number,
): LinkedList<T> => {
  const storage = getListStorage(list);
  const nextLength = Math.max(0, length | 0);
  if (nextLength >= storage.length) return storage;
  if (nextLength === 0) {
    storage.head = storage.tail = null;
    storage.length = 0;
    return storage;
  }
  const tail = storage.item(nextLength - 1);
  if (tail) {
    tail.next = null;
    storage.tail = tail;
    storage.length = nextLength;
  }
  return storage;
};

const indexOfInList = <T>(
  list: LinkedList<T>,
  value: T,
): number => {
  let i = 0;
  for (const item of list) {
    if (item === value) return i;
    i++;
  }
  return -1;
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
  static readonly #cache = new $WeakMap<
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
    if (!data) {
      DOMStringMapInternals.#cache.set(
        map,
        data = FunctionPrototypeCall(fn, map, map),
      );
    }
    return data!;
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
    data[k] = v ?? undefined;
    if (node) {
      const name = this.toAttrName(k);
      let attr = node.attributes?.getNamedItem(name) ?? null;
      if (!attr && node.ownerDocument) {
        attr = node.ownerDocument.createAttribute(name, v ?? "");
        attr && node.attributes?.setNamedItem(attr);
      } else if (!attr && node.nodeType === 1) {
        const el = node as Element;
        el.setAttribute(name, v ?? "");
      }
    }
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
    const name = StringPrototypeReplace(
      key,
      /((?<=^|[^A-Z])[A-Z])/g,
      (_, c) => `-${c}`,
    );
    return `data-${StringPrototypeToLowerCase(name)}`;
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

  constructor(
    _ownerNode?: Node | null,
    nodes?: Iterable<Node>,
    getItems?: (() => Node[]) | null,
  ) {
    const storage = LIST_STORAGE;
    const proxy = new Proxy(this, {
      get: (t, p, r) => {
        if (p === "constructor") return NodeList;
        if (p === Symbol.toStringTag) return "NodeList";
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
        }
        return undefined;
      },
      set: (t, p, v, r) => {
        if (p === "length") {
          trimList(t, Number(v));
          return true;
        }
        const index = toArrayIndex(p);
        if (index !== null) {
          setListIndex(t, index, v as Node);
          return true;
        }
        return ReflectSet(t, p, v, r);
      },
      has: (t, p) => {
        if (isString(p)) {
          const index = toArrayIndex(p);
          if (index !== null) return refreshList(t).at(index) !== null;
        }
        return ReflectHas(t, p);
      },
      ownKeys: (t) => {
        const list = refreshList(t);
        const keys = ReflectOwnKeys(t);
        for (let i = 0; i < list.length; i++) {
          keys.push(String(i));
        }
        return [...new Set(keys).add("length")];
      },
      getOwnPropertyDescriptor: (t, p) => {
        const index = toArrayIndex(p);
        if (index !== null) {
          const value = refreshList(t).at(index);
          if (value !== null) {
            return {
              enumerable: true,
              configurable: true,
              writable: true,
              value,
            };
          }
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
      },
      deleteProperty: (t, p) => {
        const index = toArrayIndex(p);
        if (index !== null) {
          deleteListIndex(t, index);
          return true;
        }
        return ReflectDeleteProperty(t, p);
      },
      defineProperty: (t, p, desc) => {
        const index = toArrayIndex(p);
        if (index !== null && "value" in desc) {
          setListIndex(t, index, desc.value as Node);
          return true;
        }
        if (p === "length" && "value" in desc && isNumber(desc.value)) {
          trimList(t, Number(desc.value));
          return true;
        }
        return ReflectDefineProperty(t, p, desc);
      },
    });
    const list = new LinkedList(...nodes ?? []);
    storage.set(this, list).set(proxy, list);
    ObjectDefineProperty(proxy, PROXY_TARGET, { value: this });
    if (getItems) setListMeta(proxy, getItems, _ownerNode ?? undefined);
    return proxy;
  }

  get length(): number {
    return refreshList(this).length;
  }

  set length(value: number) {
    trimList(this, value);
  }

  item(index: number): Node | null {
    return refreshList(this).at(index);
  }

  forEach<This = void>(
    callback: (this: This, node: Node, index: number, list: NodeList) => void,
    thisArg?: This,
  ): void {
    const list = refreshList(this);
    for (let i = 0; i < list.length; i++) {
      const node = list.at(i)!;
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
    const list = refreshList(this);
    for (let i = 0; i < list.length; i++) {
      yield [i, list.at(i)!];
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
    getItems?: (() => T[]) | null,
  ): NodeListOf<T>;
  new (
    ownerNode?: Node | null,
    nodes?: Iterable<Node>,
    getItems?: (() => Node[]) | null,
  ): NodeList;
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

export type OwnerElement = ParentNode | Element | Document | DocumentFragment;

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
        const keys = ReflectOwnKeys(t);

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
      this.#tokens = StringPrototypeSplit(StringPrototypeTrim(value), /\s+/)
        .filter((t) => t.length > 0);
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
    this.#tokens = list.filter((t, i, a) => indexOf(a, t) === i);
    this.#updateAttribute();
  }

  remove(...tokens: string[]): void {
    this.#tokens = this.#updateTokens().filter((t) =>
      indexOf(tokens, t) === -1
    );
    this.#updateAttribute();
  }

  toggle(token: string, force?: boolean): boolean {
    const contains = this.#updateTokens()?.includes(token) ?? false;
    if (force == null) force = !contains;
    if (force) {
      this.add(token);
    } else {
      this.remove(token);
    }
    return !contains;
  }

  replace(oldToken: string, newToken: string): boolean {
    const tokens = this.#updateTokens();
    const index = indexOf(tokens, oldToken);
    if (index === -1) return false;
    tokens[index] = newToken;
    this.#tokens = tokens.filter((t, i, a) => indexOf(a, t) === i);
    this.#updateAttribute(this.#tokens.join(" "));
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
      set: (t, p, v) => _.DOMStringMap.set(t, String(p), v as string | null),
      deleteProperty: (t, p) =>
        isString(p) ? _.DOMStringMap.delete(t, p) : ReflectDeleteProperty(t, p),
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);
        const data = _.DOMStringMap.getData(t);
        const props = Object.keys(data);
        return [...new Set([...keys, ...props])];
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p) && _.DOMStringMap.has(t, p)) {
          return {
            value: _.DOMStringMap.get(t, p),
            writable: true,
            enumerable: true,
            configurable: true,
          };
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
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

// #endregion NamedNodeMap
