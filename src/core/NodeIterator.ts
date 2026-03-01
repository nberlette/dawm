import _, {
  defineGetters,
  SymbolToStringTag,
  toStringTag,
} from "../_internal.ts";
import { type Node } from "./Node.ts";
import { NodeFilter } from "./NodeFilter.ts";

// #endregion ChildNode
// #region NodeIterator
declare module "../internal/api.ts" {
  export interface internal {
    NodeIterator: NodeIteratorInternals;
  }

  export interface NodeIteratorInternals {
    new: (
      root: Node,
      referenceNode: Node,
      filter?: NodeFilter | null,
      whatToShow?: number,
      pointerBeforeReferenceNode?: boolean,
    ) => NodeIterator;
    setRoot(iterator: NodeIterator, root: Node): NodeIterator;
    setFilter(iterator: NodeIterator, filter: NodeFilter | null): NodeIterator;
    setWhatToShow(iterator: NodeIterator, whatToShow: number): NodeIterator;
    setRootNode(iterator: NodeIterator, root: Node): NodeIterator;
    setReferenceNode(iterator: NodeIterator, referenceNode: Node): NodeIterator;
    setPointerBeforeReferenceNode(
      iterator: NodeIterator,
      value: boolean | null | undefined,
    ): NodeIterator;
    setDetached(
      iterator: NodeIterator,
      detached?: boolean | null | undefined,
    ): NodeIterator;
  }
}

/**
 * An iterator over the members of a list of the nodes in a subtree of the DOM.
 * The nodes will be returned in document order.
 *
 * [MDN Reference](https://mdn.io/NodeIterator)
 */
export interface NodeIterator {
  /** [MDN Reference](https://mdn.io/NodeIterator/filter) */
  readonly filter: NodeFilter | null;
  /** [MDN Reference](https://mdn.io/NodeIterator/pointerBeforeReferenceNode) */
  readonly pointerBeforeReferenceNode: boolean;
  /** [MDN Reference](https://mdn.io/NodeIterator/referenceNode) */
  readonly referenceNode: Node;
  /** [MDN Reference](https://mdn.io/NodeIterator/root) */
  readonly root: Node;
  /** [MDN Reference](https://mdn.io/NodeIterator/whatToShow) */
  readonly whatToShow: number;
  /**
   * @deprecated
   * [MDN Reference](https://mdn.io/NodeIterator/detach)
   */
  detach(): void;
  /** [MDN Reference](https://mdn.io/NodeIterator/nextNode) */
  nextNode(): Node | null;
  /** [MDN Reference](https://mdn.io/NodeIterator/previousNode) */
  previousNode(): Node | null;
}

export class NodeIterator {
  #root: Node = null!;
  #filter: { acceptNode(node: Node): number } | null = null;
  #whatToShow = 0;
  #referenceNode: Node = null!;
  #pointerBeforeRef = false;
  #detached = false;

  protected constructor() {
    if (new.target === NodeIterator) {
      if (arguments[arguments.length - 1] !== _.symbols.kPrivate) {
        throw new TypeError("Illegal constructor");
      }
    }
  }

  detach(): void {
    if (!this.#detached) {
      // mark it as detached
      this.#detached = true;
      // now we actually detach the iterator from its anchor points
      this.#root = null!;
      this.#referenceNode = null!;
      this.#filter = null;
      this.#whatToShow = 0;
      this.#pointerBeforeRef = false;
    }
  }

  nextNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("NodeIterator is detached", "InvalidStateError");
    }

    let node: Node | null = this.#referenceNode;
    if (this.#pointerBeforeRef && node) node = node.previousSibling;
    const whatToShow = this.#whatToShow;

    while (node && !((1 << node.nodeType) & whatToShow)) {
      node = node.nextSibling;
    }

    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#referenceNode = node;
        return node;
      }
      node = node.nextSibling;
    }

    return null;
  }

  previousNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("NodeIterator is detached", "InvalidStateError");
    }

    let node: Node | null = this.#referenceNode;
    if (this.#pointerBeforeRef && node) node = node.previousSibling;

    const whatToShow = this.#whatToShow;
    while (node && !((1 << node.nodeType) & whatToShow)) {
      node = node.previousSibling;
    }

    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#referenceNode = node;
        return node;
      }
      node = node.previousSibling;
    }

    return null;
  }

  declare readonly [SymbolToStringTag]: "NodeIterator";

  static {
    toStringTag("NodeIterator")(this);

    _.NodeIterator = {
      new: (
        root,
        referenceNode,
        filter = null,
        whatToShow = 0,
        pointerBeforeReferenceNode = false,
      ) => {
        const iter = new (NodeIterator as any)(_.symbols.kPrivate);
        _.NodeIterator.setFilter(iter, filter);
        _.NodeIterator.setRoot(iter, root);
        _.NodeIterator.setWhatToShow(iter, whatToShow);
        _.NodeIterator.setReferenceNode(iter, referenceNode);
        _.NodeIterator.setPointerBeforeReferenceNode(
          iter,
          pointerBeforeReferenceNode,
        );
        return iter;
      },
      setDetached: (it, value) => (it.#detached = !!value, it),
      setRoot: (it, root) => (it.#root = root, it),
      setRootNode: (it, root) => (it.#root = root, it),
      setReferenceNode: (
        it,
        referenceNode,
      ) => (it.#referenceNode = referenceNode, it),
      setFilter: (it, filter) => {
        if (typeof filter === "function") filter = { acceptNode: filter };
        if (
          typeof filter !== "object" || filter === null ||
          typeof filter.acceptNode !== "function"
        ) {
          throw new TypeError(
            "Invalid value received for the 'filter' argument. Expected a NodeFilter value, either as a direct function or on an object (as the 'acceptNode' method).",
          );
        }
        it.#filter = filter;
        return it;
      },
      setWhatToShow: (it, whatToShow) => (it.#whatToShow = whatToShow || 0, it),
      setPointerBeforeReferenceNode: (
        it,
        value,
      ) => (it.#pointerBeforeRef = !!value, it),
    };

    defineGetters(this.prototype, {
      root: (n) => n.#root,
      referenceNode: (n) => n.#referenceNode,
      pointerBeforeReferenceNode: (n) => n.#pointerBeforeRef,
      filter: (n) => n.#filter,
      whatToShow: (n) => n.#whatToShow,
    });
  }
}
