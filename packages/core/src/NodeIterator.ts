import _, {
  defineGetters,
  SymbolToStringTag,
  toStringTag,
} from "dawm-internal";
import { type Node } from "./Node.ts";
import { NodeFilter } from "./NodeFilter.ts";
import { DOMException } from "./DOMException.ts";

function isVisible(
  node: Node,
  whatToShow: number,
  filter: { acceptNode(node: Node): number } | null,
): boolean {
  return !!(whatToShow & (1 << (node.nodeType - 1))) &&
    (filter?.acceptNode(node) ?? NodeFilter.FILTER_ACCEPT) ===
      NodeFilter.FILTER_ACCEPT;
}

function nextNodeInSubtree(root: Node, node: Node): Node | null {
  if (node.firstChild) return node.firstChild;
  let current: Node | null = node;
  while (current && current !== root) {
    if (current.nextSibling) return current.nextSibling;
    current = current.parentNode;
  }
  return null;
}

function previousNodeInSubtree(root: Node, node: Node): Node | null {
  if (node === root) return null;
  if (node.previousSibling) {
    let current = node.previousSibling;
    while (current.lastChild) current = current.lastChild;
    return current;
  }
  return node.parentNode;
}

// #endregion ChildNode
// #region NodeIterator
declare module "dawm-internal" {
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
    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: NodeIterator,
      abstract: true,
    });
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

    let node: Node | null = this.#pointerBeforeRef
      ? this.#referenceNode
      : nextNodeInSubtree(this.#root, this.#referenceNode);
    while (node) {
      if (isVisible(node, this.#whatToShow, this.#filter)) {
        this.#referenceNode = node;
        this.#pointerBeforeRef = false;
        return node;
      }
      node = nextNodeInSubtree(this.#root, node);
    }

    return null;
  }

  previousNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("NodeIterator is detached", "InvalidStateError");
    }

    let node: Node | null = this.#pointerBeforeRef
      ? previousNodeInSubtree(this.#root, this.#referenceNode)
      : this.#referenceNode;
    while (node) {
      if (isVisible(node, this.#whatToShow, this.#filter)) {
        this.#referenceNode = node;
        this.#pointerBeforeRef = true;
        return node;
      }
      node = previousNodeInSubtree(this.#root, node);
    }

    return null;
  }

  static create(
    root: Node,
    referenceNode: Node,
    filter: NodeFilter | null = null,
    whatToShow = 0,
    pointerBeforeReferenceNode = false,
  ): NodeIterator {
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
      ) =>
        NodeIterator.create(
          root,
          referenceNode,
          filter,
          whatToShow,
          pointerBeforeReferenceNode,
        ),
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
