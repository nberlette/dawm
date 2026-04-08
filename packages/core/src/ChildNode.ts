import { _ } from "dawm-internal";
import { DOMException } from "./DOMException.ts";
import { Node } from "./Node.ts";

export abstract class ChildNode extends Node {
  constructor() {
    super();

    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: ChildNode,
      abstract: true,
    });
  }

  before(...nodes: (string | Node)[]): void {
    if (!this.parentNode) {
      throw new DOMException(
        "Failed to execute 'before' on 'Node': The node has no parent.",
        "HierarchyRequestError",
      );
    }
    let refNode = this as Node | null;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (typeof node === "string") {
        if (!this.ownerDocument) {
          throw new DOMException(
            "Failed to execute 'before' on 'Node': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
        node = this.ownerDocument.createTextNode(node);
      }
      this.parentNode.insertBefore(node, refNode);
      refNode = node.nextSibling;
    }
  }

  after(...nodes: (string | Node)[]): void {
    if (!this.parentNode) {
      throw new DOMException(
        "Failed to execute 'after' on 'Node': The node has no parent.",
        "HierarchyRequestError",
      );
    }
    let refNode = this.nextSibling;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (typeof node === "string") {
        if (this.ownerDocument) {
          node = this.ownerDocument.createTextNode(node);
        } else {
          throw new DOMException(
            "Failed to execute 'after' on 'Node': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
      }
      this.parentNode.insertBefore(node, refNode);
      refNode = node.nextSibling;
    }
  }

  replaceWith(...nodes: (string | Node)[]): void {
    if (!this.parentNode) {
      throw new DOMException(
        "Failed to execute 'replaceWith' on 'Node': The node has no parent.",
        "HierarchyRequestError",
      );
    }
    let refNode = this as Node | null;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (typeof node === "string") {
        if (this.ownerDocument) {
          node = this.ownerDocument.createTextNode(node);
        } else {
          throw new DOMException(
            "Failed to execute 'replaceWith' on 'Node': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
      }
      this.parentNode.insertBefore(node, refNode);
      refNode = node.nextSibling;
    }
    this.parentNode.removeChild(this);
  }

  remove(): void {
    if (!this.parentNode) {
      throw new DOMException(
        "Failed to execute 'remove' on 'Node': The node has no parent.",
        "HierarchyRequestError",
      );
    }
    this.parentNode.removeChild(this);
  }
}
