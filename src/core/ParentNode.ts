import {
  _,
  ArrayPrototypePush,
  StringPrototypeToLowerCase,
  uncurryThis,
} from "../_internal.ts";
import { NodeList, NodeListOf } from "../collections/NodeList.ts";
import {
  createHTMLCollection,
  type HTMLCollection,
  type HTMLCollectionOf,
} from "../collections/HTMLCollection.ts";
import { DOMTokenList } from "../collections/DOMTokenList.ts";
import Sizzle from "../tree/sizzle.ts";
import { NodeType } from "./types.ts";
import type { Element } from "./Element.ts";
import { Node } from "./Node.ts";
import { Text } from "./Text.ts";

const DOMTokenListPrototypeContains = uncurryThis(
  DOMTokenList.prototype.contains,
  {} as DOMTokenList,
);

export abstract class ParentNode extends Node {
  #sizzle: Sizzle | undefined;

  get [_.symbols.kSizzle](): Sizzle {
    return this.#sizzle ??= Sizzle({ document: this.ownerDocument! } as any);
  }

  get firstElementChild(): Element | null {
    for (let n = this.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === NodeType.Element) return n as Element;
    }
    return null;
  }

  get lastElementChild(): Element | null {
    for (let n = this.lastChild; n; n = n.previousSibling) {
      if (n.nodeType === NodeType.Element) return n as Element;
    }
    return null;
  }

  get childElementCount(): number {
    let i = 0;
    for (let n = this.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === NodeType.Element) i++;
    }
    return i;
  }

  get nextElementSibling(): Element | null {
    for (let n = this.nextSibling; n; n = n.nextSibling) {
      if (n.nodeType === NodeType.Element) return n as Element;
    }
    return null;
  }

  get previousElementSibling(): Element | null {
    for (let n = this.previousSibling; n; n = n.previousSibling) {
      if (n.nodeType === NodeType.Element) return n as Element;
    }
    return null;
  }

  get children(): HTMLCollection {
    return createHTMLCollection(this, () => {
      const elements: Element[] = [];
      for (let n = this.firstElementChild; n; n = n.nextElementSibling) {
        ArrayPrototypePush(elements, n);
      }
      return elements;
    }, "children");
  }

  append(...nodes: (string | Node)[]): void {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (typeof node === "string") {
        if (this.ownerDocument) {
          node = this.ownerDocument.createTextNode(node);
        } else {
          throw new DOMException(
            "Failed to execute 'append' on 'ParentNode': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
      }
      this.appendChild(node);
    }
  }

  prepend(...nodes: (string | Node)[]): void {
    let refNode = this.firstChild;
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (typeof node === "string") {
        if (this.ownerDocument) {
          node = this.ownerDocument.createTextNode(node);
        } else {
          throw new DOMException(
            "Failed to execute 'prepend' on 'ParentNode': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
      }
      this.insertBefore(node, refNode);
      refNode = node.nextSibling;
    }
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
        if (this.ownerDocument) {
          node = this.ownerDocument.createTextNode(node);
        } else {
          throw new DOMException(
            "Failed to execute 'before' on 'Node': The node is disconnected from an owner document, and missing the required subtree context. Attach the node to a valid owner document and try again.",
            "HierarchyRequestError",
          );
        }
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

  replaceChildren(...nodes: (string | Node)[]): void {
    while (this.firstChild) this.removeChild(this.firstChild);
    this.append(...nodes);
  }

  querySelector<T extends Element>(selectors: string): T | null {
    return this[_.symbols.kSizzle].first(selectors, this) as T ?? null;
  }

  querySelectorAll<T extends Element>(selectors: string): NodeListOf<T> {
    const elements = this[_.symbols.kSizzle].select(selectors, this);
    return new NodeList(this, elements) as NodeListOf<T>;
  }

  getElementById(elementId: string): Element | null {
    function traverse(node: Node | null): Element | null {
      while (node) {
        if (node.nodeType === NodeType.Element) {
          const element = node as Element;
          if (element.getAttribute("id") === elementId) {
            return element;
          } else if (element.id === elementId) {
            return element;
          } else if (element.getAttribute("name") === elementId) {
            return element;
          }
        }
        if (node.nextSibling) {
          node = node.nextSibling;
        } else {
          node = node.firstChild;
        }
      }
      return null;
    }

    let child = this.firstChild;
    while (child) {
      const result = traverse(child);
      if (result) return result;
      child = child.nextSibling;
    }
    return null;
  }

  getElementsByTagName<T extends Element>(
    tagName: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];
      const lowerTagName = StringPrototypeToLowerCase(tagName);

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (
              tagName === "*" ||
              StringPrototypeToLowerCase(element.tagName) === lowerTagName
            ) {
              ArrayPrototypePush(elements, element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };
    return createHTMLCollection(this, get, "getElementsByTagName");
  }

  getElementsByTagNameNS<T extends Element>(
    namespace: string | null,
    localName: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];
      const lowerLocalName = StringPrototypeToLowerCase(localName);

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            const elementNamespace = element.namespaceURI ?? null;
            if (
              (localName === "*" ||
                StringPrototypeToLowerCase(element.localName) ===
                  lowerLocalName) &&
              (namespace === "*" || elementNamespace === namespace)
            ) {
              ArrayPrototypePush(elements, element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };
    return createHTMLCollection(this, get, "getElementsByTagNameNS");
  }

  getElementsByClassName<T extends Element>(
    className: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];
      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (DOMTokenListPrototypeContains(element.classList, className)) {
              ArrayPrototypePush(elements, element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };
      traverse(this.firstChild);
      return elements;
    };
    return createHTMLCollection(this, get, "getElementsByClassName");
  }
}
