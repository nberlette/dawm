import {
  _,
  deleteListIndex,
  FunctionPrototypeBind,
  FunctionPrototypeCall,
  getListGetter,
  getListOwner,
  getListStorage,
  isFunction,
  isNumber,
  isString,
  LIST_STORAGE,
  Number,
  ObjectCreate,
  ObjectDefineProperties,
  ObjectDefineProperty,
  ObjectFreeze,
  ObjectGetOwnPropertyDescriptors,
  PROXIED_METHODS,
  PROXY_TARGET,
  ReflectDefineProperty,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
  ReflectSet,
  refreshList,
  setListIndex,
  setListMeta,
  SymbolIterator,
  SymbolToStringTag,
  toArrayIndex,
  trimList,
  uncurryThis,
  WeakMap as $WeakMap,
  WeakMapPrototypeGetOrInsertComputed,
  WeakMapPrototypeSet,
} from "dawm-internal/collections/common";
import type { Node } from "dawm-core/node";
import { LinkedList } from "dawm-internal/collections/linked-list";

declare module "dawm-internal" {
  export interface NodeListInternal {
    new: <T extends Node>(
      ownerNode?: Node | null,
      nodes?: Iterable<T>,
      getItems?: (() => Iterable<T>) | null,
    ) => NodeListOf<T>;
    refreshItems<T extends Node>(nodeList: NodeListOf<T>): Iterable<T>;
    getOwnerNode<T extends Node>(nodeList: NodeListOf<T>): Node | null;
    setOwnerNode<T extends Node>(
      nodeList: NodeListOf<T>,
      owner: Node | null,
    ): NodeListOf<T>;
    getListGetter<T extends Node>(
      nodeList: NodeListOf<T>,
    ): (() => Iterable<T>) | null;
    setListGetter<T extends Node>(
      nodeList: NodeListOf<T>,
      getItems: (() => Iterable<T>) | null,
    ): NodeListOf<T>;
    getLinkedList<T extends Node>(nodeList: NodeListOf<T>): LinkedList<T>;
    setLinkedList<T extends Node>(
      nodeList: NodeListOf<T>,
      list: LinkedList<T>,
    ): NodeListOf<T>;
    wrap<T extends Node>(
      nodeList: NodeListOf<T>,
      owner: Node | null,
      nodes: Iterable<T>,
      getItems: (() => Iterable<T>) | null,
    ): NodeListOf<T>;
  }

  export interface internal {
    NodeList: NodeListInternal;
  }
}

/**
 * Represents a DOM NodeList as defined by the DOM Standard, which is an
 * array-like object that represents a collection of {@linkcode Node} objects.
 *
 * @category Collections
 * @tags NodeList
 */
export class NodeList {
  [index: number]: Node;

  constructor() {
    _.enforcePrivateConstructor({ arguments });
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

  *[SymbolIterator](): IterableIterator<Node> {
    return yield* NodeListPrototypeValues(this);
  }

  declare readonly [SymbolToStringTag]: "NodeList";

  static {
    _.toStringTag("NodeList")(this);
    _.NodeList = {
      new: (owner, nodes, get) => {
        const nl = new (NodeList as any)(_.keys._private);
        return _.NodeList.wrap(
          nl,
          owner ?? null,
          nodes ?? get?.() ?? [],
          get ?? null,
        );
      },
      wrap: (nodeList, ownerNode, nodes, getItems) => {
        const storage = LIST_STORAGE;
        const proxy = new Proxy(nodeList, {
          get: (t, p) => {
            if (p === "constructor") return NodeList;
            if (p === SymbolToStringTag) return "NodeList";
            if (p === "length") return refreshList(t).length;
            if (p === SymbolIterator) p = "values";
            const cache = WeakMapPrototypeGetOrInsertComputed(
              PROXIED_METHODS,
              t,
              () => new $WeakMap(),
            );
            if (ReflectHas(t, p)) {
              const v = ReflectGet(t, p);
              if (isFunction(v)) {
                const bound = WeakMapPrototypeGetOrInsertComputed(
                  cache,
                  v,
                  (fn) =>
                    ObjectDefineProperties(
                      FunctionPrototypeBind(fn, t),
                      ObjectGetOwnPropertyDescriptors(fn),
                    ),
                );
                return bound;
              }
              return v;
            } else if (isString(p)) {
              const index = toArrayIndex(p);
              if (index !== null) return refreshList(t).at(index);
            }
            return ReflectGet(t, p);
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
        WeakMapPrototypeSet(storage, nodeList, list);
        WeakMapPrototypeSet(storage, proxy, list);
        ObjectDefineProperty(proxy, PROXY_TARGET, { value: nodeList });
        if (getItems) setListMeta(proxy, getItems, ownerNode ?? undefined);
        return proxy;
      },
      getOwnerNode: (nodeList) => getListOwner(nodeList),
      setOwnerNode: (nodeList, owner) => {
        setListMeta(nodeList, undefined, owner ?? undefined);
        return nodeList;
      },
      getListGetter: (nodeList) => getListGetter(nodeList) ?? null,
      setListGetter: (nodeList, getItems) => {
        setListMeta(nodeList, getItems ?? undefined);
        return nodeList;
      },
      getLinkedList: (nodeList) => {
        const storage = LIST_STORAGE;
        return WeakMapPrototypeGetOrInsertComputed(
          storage,
          nodeList,
          () => new LinkedList(),
        ) as never;
      },
      setLinkedList: (nodeList, list) => {
        const storage = LIST_STORAGE;
        WeakMapPrototypeSet(storage, nodeList, list);
        return nodeList;
      },
      refreshItems: (nodeList) => {
        refreshList(nodeList);
        return getListStorage(nodeList) as never;
      },
    };
  }
}

const NodeListPrototype = ObjectFreeze(
  ObjectCreate(null, ObjectGetOwnPropertyDescriptors(NodeList.prototype)),
);
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
