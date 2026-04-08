import _, {
  defineGetters,
  SymbolToStringTag,
  toStringTag,
} from "dawm-internal";
import type { Node } from "./Node.ts";
import { NodeFilter } from "./NodeFilter.ts";
import { DOMException } from "./DOMException.ts";

declare module "dawm-internal" {
  export interface internal {
    TreeWalker: TreeWalkerInternals;
  }

  export interface TreeWalkerInternals {
    new: (
      root: Node,
      currentNode: Node,
      filter?: NodeFilter | null,
      whatToShow?: number,
      entityReferenceExpansion?: boolean | null | undefined,
    ) => TreeWalker;
    setRoot(iterator: TreeWalker, root: Node): TreeWalker;
    setFilter(iterator: TreeWalker, filter: NodeFilter | null): TreeWalker;
    setWhatToShow(iterator: TreeWalker, whatToShow: number): TreeWalker;
    setRootNode(iterator: TreeWalker, root: Node): TreeWalker;
    setCurrentNode(iterator: TreeWalker, currentNode: Node): TreeWalker;
    setDetached(
      iterator: TreeWalker,
      detached?: boolean | null | undefined,
    ): TreeWalker;
    setEntityReferenceExpansion(
      iterator: TreeWalker,
      entityReferenceExpansion: boolean,
    ): TreeWalker;
  }
}

/**
 * An iterator over the members of a list of the nodes in a subtree of the DOM.
 * The nodes will be returned in document order.
 *
 * [MDN Reference](https://mdn.io/TreeWalker)
 */
export interface TreeWalker {
  /** [MDN Reference](https://mdn.io/TreeWalker/filter) */
  readonly filter: NodeFilter | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/currentNode) */
  readonly currentNode: Node;
  /** [MDN Reference](https://mdn.io/TreeWalker/root) */
  readonly root: Node;
  /** [MDN Reference](https://mdn.io/TreeWalker/whatToShow) */
  readonly whatToShow: number;
  /**
   * @deprecated
   * [MDN Reference](https://mdn.io/TreeWalker/detach)
   */
  detach(): void;
  /** [MDN Reference](https://mdn.io/TreeWalker/nextNode) */
  nextNode(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/previousNode) */
  previousNode(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/firstChild) */
  firstChild(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/lastChild) */
  lastChild(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/parentNode) */
  parentNode(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/previousSibling) */
  previousSibling(): Node | null;
  /** [MDN Reference](https://mdn.io/TreeWalker/nextSibling) */
  nextSibling(): Node | null;
}

export class TreeWalker {
  #root: Node = null!;
  #filter: { acceptNode(node: Node): number } | null = null;
  #whatToShow = 0;
  #entityReferenceExpansion = false;
  #currentNode: Node = null!;
  #detached = false;

  constructor() {
    // this constructor is not meant to be called directly
    //
    // WRONG:     new TreeWalker(...)
    //
    // RIGHT:    document.createTreeWalker(...)
    if (new.target === TreeWalker) {
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
      this.#currentNode = null!;
      this.#filter = null;
      this.#whatToShow = 0;
    }
  }

  nextNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }

    let node: Node | null = this.#currentNode;
    const whatToShow = this.#whatToShow;
    while (node && !(whatToShow & (1 << (node.nodeType - 1)))) {
      node = node.nextSibling;
    }
    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.nextSibling;
    }

    return null;
  }

  previousNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }

    let node: Node | null = this.#currentNode;
    const whatToShow = this.#whatToShow;
    while (node && !(whatToShow & (1 << (node.nodeType - 1)))) {
      node = node.previousSibling;
    }
    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.previousSibling;
    }

    return null;
  }

  firstChild(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }

    let node: Node | null = this.#currentNode.firstChild;
    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.nextSibling;
    }

    return null;
  }

  lastChild(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }

    let node: Node | null = this.#currentNode.lastChild;
    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.previousSibling;
    }

    return null;
  }

  parentNode(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }

    let node: Node | null = this.#currentNode.parentNode;
    // if node is above the treewalkers root, return null
    while (node && node !== this.#root) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.parentNode;
    }

    return null;
  }

  nextSibling(): Node | null {
    if (this.#detached) {
      throw new DOMException("TreeWalker is detached", "InvalidStateError");
    }
    const whatToShow = this.#whatToShow;
    let node: Node | null = this.#currentNode.nextSibling;
    while (node && !(whatToShow & (1 << (node.nodeType - 1)))) {
      node = node.nextSibling;
    }
    while (node) {
      if (this.#filter?.acceptNode(node) === NodeFilter.FILTER_ACCEPT) {
        this.#currentNode = node;
        return node;
      }
      node = node.nextSibling;
    }

    return null;
  }

  static create(
    root: Node,
    currentNode: Node,
    filter: NodeFilter | null = null,
    whatToShow = 0,
    entityReferenceExpansion = false,
  ): TreeWalker {
    const iter = new (TreeWalker as any)(_.symbols.kPrivate);
    _.TreeWalker.setFilter(iter, filter);
    _.TreeWalker.setRoot(iter, root);
    _.TreeWalker.setWhatToShow(iter, whatToShow);
    _.TreeWalker.setCurrentNode(iter, currentNode);
    _.TreeWalker.setEntityReferenceExpansion(iter, entityReferenceExpansion);
    return iter;
  }

  declare readonly [SymbolToStringTag]: "TreeWalker";

  static {
    toStringTag("TreeWalker")(this);

    _.TreeWalker = {
      new: (
        root,
        currentNode,
        filter = null,
        whatToShow = 0,
        refEx = false,
      ) =>
        TreeWalker.create(
          root,
          currentNode,
          filter,
          whatToShow,
          !!refEx,
        ),
      setDetached: (it, value) => (it.#detached = !!value, it),
      setRoot: (it, root) => (it.#root = root, it),
      setRootNode: (it, root) => (it.#root = root, it),
      setCurrentNode: (
        it,
        currentNode,
      ) => (it.#currentNode = currentNode, it),
      setFilter: (it, filter) => {
        if (typeof filter === "function") filter = { acceptNode: filter };
        if (
          typeof filter !== "object" || filter === null ||
          typeof filter.acceptNode !== "function"
        ) {
          throw new TypeError(
            "Invalid value received for the 'filter' argument. Expected a NodeFilter value, either as a direct function or an object with an 'acceptNode' method.",
          );
        }
        it.#filter = filter;
        return it;
      },
      setWhatToShow: (it, whatToShow) => (it.#whatToShow = whatToShow || 0, it),
      setEntityReferenceExpansion: (
        it,
        re,
      ) => (it.#entityReferenceExpansion = !!re, it),
    };

    defineGetters(this.prototype, {
      root: (tw) => tw.#root,
      currentNode: (tw) => tw.#currentNode,
      filter: (tw) => tw.#filter,
      whatToShow: (tw) => tw.#whatToShow,
    });
  }
}
