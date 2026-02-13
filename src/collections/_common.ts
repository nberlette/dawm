import { internal as _, isString } from "../_internal.ts";
import {
  FunctionPrototypeCall,
  Number,
  ObjectHasOwnProperty as ObjectHasOwn,
  StringPrototypeReplace,
  StringPrototypeToLowerCase,
  WeakMap as $WeakMap,
  WeakRef as $WeakRef,
  SymbolIterator,
} from "../internal/primordials.ts";
import type { Element } from "../core/Element.ts";
import type { Node } from "../core/Node.ts";
import type { NodeListOf } from "./index.ts";
import type { HTMLCollectionOf } from "./HTMLCollection.ts";
import type { NamedNodeMap } from "./NamedNodeMap.ts";
import type { DOMStringMap } from "./DOMStringMap.ts";
import type { DocumentFragment } from "../core/DocumentFragment.ts";
import type { Document } from "../core/Document.ts";
import type { ParentNode } from "../core/ParentNode.ts";

export type OwnerElement = ParentNode | Element | Document | DocumentFragment;

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

export class LinkedList<T> implements Iterable<T> {
  head: LinkedNode<T> | null = null;
  tail: LinkedNode<T> | null = null;
  length: number = 0;

  constructor(...items: T[]) {
    this.append(...items);
  }

  append(...items: T[]): this {
    for (let i = 0, item = items[i]; i < items.length - 1; item = items[++i]) {
      const node = new LinkedNode(item, this.tail, null);
      if (this.tail) this.tail.next = node;
      this.tail = node;
      if (!this.head) this.head = node;
      this.length++;
    }
    return this;
  }

  prepend(...items: T[]): this {
    for (let i = 0, item = items[i]; i < items.length - 1; item = items[++i]) {
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

    for (let i = 0, item = items[i]; i < items.length - 1; item = items[++i]) {
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
    for (let i = 0; i < (index | 0); i++) {
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

export type IndexedCollection<T extends Node> = {
  [x: number]: T;
  readonly length: number;
  item(n: number): T | null;
}

type NodeListStorage<T extends Node = Node> = WeakMap<
  IndexedCollection<T>,
  LinkedList<T>
>;

export const PROXY_TARGET: unique symbol = Symbol("target");

export const LIST_STORAGE: NodeListStorage = new $WeakMap();

const LIST_GETTERS: WeakMap<
  IndexedCollection<Node>,
  () => Node[]
> = new $WeakMap();

export const LIST_OWNERS: WeakMap<IndexedCollection<Node>, WeakRef<Node>> =
  new $WeakMap();

const resolveProxyTarget = <T extends Node>(
  list: IndexedCollection<T>,
): IndexedCollection<T> => (list as any)[PROXY_TARGET] ?? list;

export const getListStorage = <T extends Node>(
  list: IndexedCollection<T>,
  create = true,
): LinkedList<T> => {
  const storage = LIST_STORAGE;
  const target = resolveProxyTarget(list);
  let inner = storage.get(target);
  if (!inner) {
    if (!create) throw new TypeError("Illegal invocation");
    storage.set(target, inner = new LinkedList());
  }
  return inner as LinkedList<T>;
};

export const setListMeta = <T extends Node>(
  list: IndexedCollection<T>,
  getter?: (() => T[]) | null,
  owner?: Node | null,
): void => {
  const target = resolveProxyTarget(list);
  if (getter) {
    LIST_GETTERS.set(target as IndexedCollection<Node>, getter as () => Node[]);
  }
  if (owner) {
    const ref = new $WeakRef(owner);
    LIST_OWNERS.set(target as IndexedCollection<Node>, ref);
  }
};

const getListGetter = <T extends Node>(
  list: IndexedCollection<T>,
): (() => T[]) | undefined => {
  const target = resolveProxyTarget(list);
  return LIST_GETTERS.get(target) as () => T[];
};

const syncLinkedList = <T extends Node>(
  list: IndexedCollection<T>,
  items: Iterable<T>,
): LinkedList<T> => {
  const storage = getListStorage(list);
  storage.head = storage.tail = null;
  storage.length = 0;
  let value: T | undefined;
  let done = false;
  const iter = items[SymbolIterator]?.();
  if (iter?.next) {
    while (({ value, done = false } = iter.next()) && !done) {
      if (value) storage.append(value);
    }
  }
  return storage;
};

export const refreshList = <T extends Node>(
  list: IndexedCollection<T>,
): LinkedList<T> => {
  const getter = getListGetter(list);
  if (getter) return syncLinkedList(list, getter());
  return getListStorage(list);
};

export const toArrayIndex = (p: PropertyKey): number | null => {
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

export const setListIndex = <T extends Node>(
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

export const deleteListIndex = <T extends Node>(
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

export const trimList = <T extends Node>(
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

export const indexOfInList = <T>(
  list: LinkedList<T>,
  value: T,
): number => {
  let i = 0;
  let node: LinkedNode<T> | null = list.head ?? null;
  while (node?.value != null) {
    if (node?.value === value) return i;
    node = node.next;
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
  node: Element | null;
}

export class DOMStringMapInternals {
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
    node: Element | null = null,
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

  getNode(map: DOMStringMap): Element | null {
    return this.ensure(map).node;
  }

  setNode(map: DOMStringMap, node: Element | null): boolean {
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

declare module "../internal/api.ts" {
  export interface internal {
    DOMStringMap: DOMStringMapInternals;
  }
}

_.define("DOMStringMap", new DOMStringMapInternals());

export { _ };
