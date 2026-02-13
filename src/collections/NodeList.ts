import {
  FunctionPrototypeCall,
  isFunction,
  isNumber,
  isString,
  Number,
  ObjectDefineProperty,
  ObjectFreeze,
  ReflectDefineProperty,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  uncurryThis,
} from "../_internal.ts";
import type { Node } from "../core/index.ts";
import {
  deleteListIndex,
  LinkedList,
  LIST_STORAGE,
  PROXY_TARGET,
  refreshList,
  setListIndex,
  setListMeta,
  toArrayIndex,
  trimList,
} from "./_common.ts";

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
        const keys = ReflectOwnKeys(t) as (string | symbol)[];
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
