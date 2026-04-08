import {
  _,
  ArrayPrototypePop,
  ArrayPrototypePush,
  FunctionPrototypeBind,
  ObjectDefineProperty,
  ObjectGetOwnPropertyDescriptors,
  StringPrototypeSplit,
  StringPrototypeToLowerCase,
  StringPrototypeTrim,
  uncurryThis,
} from "dawm-internal";
import { NodeListOf } from "./collections/NodeList.ts";
import {
  createHTMLCollection,
  type HTMLCollection,
  type HTMLCollectionOf,
} from "./collections/HTMLCollection.ts";
import { DOMTokenList } from "./collections/DOMTokenList.ts";
import Sizzle from "dawm-tree/sizzle";
import { NodeType } from "./types.ts";
import type { Element } from "./Element.ts";
import { Node } from "./Node.ts";
import { DOMException } from "./DOMException.ts";

const DOMTokenListPrototypeContains = uncurryThis(
  DOMTokenList.prototype.contains,
  {} as DOMTokenList,
);

function findDescendantElement<T extends Element>(
  root: ParentNode,
  test: (element: Element) => element is T,
): T | null;
function findDescendantElement<T extends Element>(
  root: ParentNode,
  test: (element: Element) => unknown,
): T | null;
function findDescendantElement<T extends Element>(
  root: ParentNode,
  test: (element: Element) => unknown,
): T | null {
  const stack: Node[] = [];
  for (let node = root.lastChild; node; node = node.previousSibling) {
    ArrayPrototypePush(stack, node);
  }
  while (stack.length) {
    const node = ArrayPrototypePop(stack)!;
    if (_.isElement(node) && test(node)) return node as T;
    for (let child = node.lastChild; child; child = child.previousSibling) {
      ArrayPrototypePush(stack, child);
    }
  }

  return null;
}

function collectDescendantElements<T extends Element>(
  root: ParentNode,
  test: (element: Element) => element is T,
): T[];
function collectDescendantElements<T extends Element>(
  root: ParentNode,
  test: (element: Element) => unknown,
): T[];
function collectDescendantElements<T extends Element>(
  root: ParentNode,
  test: (element: Element) => unknown,
): T[] {
  const elements: T[] = [], stack: Node[] = [];
  for (let node = root.lastChild; node; node = node.previousSibling) {
    ArrayPrototypePush(stack, node);
  }
  while (stack.length) {
    const node = ArrayPrototypePop(stack)!;
    if (_.isElement(node) && test(node)) {
      ArrayPrototypePush(elements, node as T);
    }
    for (let child = node.lastChild; child; child = child.previousSibling) {
      ArrayPrototypePush(stack, child);
    }
  }
  return elements;
}

export abstract class ParentNode extends Node {
  #sizzle: Sizzle | undefined;

  get [_.symbols.kSizzle](): Sizzle {
    return this.#sizzle ??= Sizzle(
      { document: this.ownerDocument ?? this } as any,
    );
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
    const get = FunctionPrototypeBind(
      this[_.symbols.kSizzle].select,
      this[_.symbols.kSizzle],
      selectors,
      this,
    );
    return _.NodeList.new(this, get(), get) as NodeListOf<T>;
  }

  getElementById(elementId: string): Element | null {
    return findDescendantElement(
      this,
      (element) =>
        element.id === elementId || element.getAttribute("id") === elementId,
    );
  }

  getElementsByTagName<T extends Element>(
    tagName: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const lowerTagName = StringPrototypeToLowerCase(tagName);
      return collectDescendantElements<T>(
        this,
        (element) =>
          tagName === "*" ||
          StringPrototypeToLowerCase(element.tagName) === lowerTagName,
      );
    };
    return createHTMLCollection(this, get, "getElementsByTagName");
  }

  getElementsByTagNameNS<T extends Element>(
    namespace: string | null,
    localName: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const lowerLocalName = StringPrototypeToLowerCase(localName);
      return collectDescendantElements<T>(this, (element) => {
        const elementNamespace = element.namespaceURI ?? null;
        return (
          (localName === "*" ||
            StringPrototypeToLowerCase(element.localName) === lowerLocalName) &&
          (namespace === "*" || elementNamespace === namespace)
        );
      });
    };
    return createHTMLCollection(this, get, "getElementsByTagNameNS");
  }

  getElementsByClassName<T extends Element>(
    className: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const classNames = StringPrototypeSplit(
        StringPrototypeTrim(className),
        /\s+/,
      );
      if (!classNames.length || (classNames.length === 1 && !classNames[0])) {
        return [];
      }

      return collectDescendantElements<T>(
        this,
        (element) => {
          for (let i = 0; i < classNames.length; i++) {
            if (
              !DOMTokenListPrototypeContains(element.classList, classNames[i])
            ) {
              return false;
            }
          }
          return true;
        },
      );
    };
    return createHTMLCollection(this, get, "getElementsByClassName");
  }

  static {
    const descriptors = ObjectGetOwnPropertyDescriptors(this.prototype);
    for (const key in descriptors) {
      if (key === "constructor") continue;
      const descriptor = descriptors[key]!;
      const next = { ...descriptor };
      let wrapped = false;

      if (typeof descriptor.get === "function") {
        const getter = descriptor.get;
        next.get = function (this: ParentNode) {
          _.webidl.assertBranded(this, ParentNodePrototype);
          return getter.call(this);
        };
        wrapped = true;
      }

      if (typeof descriptor.set === "function") {
        const setter = descriptor.set;
        next.set = function (this: ParentNode, value: unknown) {
          _.webidl.assertBranded(this, ParentNodePrototype);
          return setter.call(this, value);
        };
        wrapped = true;
      }

      if (typeof descriptor.value === "function") {
        const method = descriptor.value;
        next.value = function (this: ParentNode, ...args: unknown[]) {
          _.webidl.assertBranded(this, ParentNodePrototype);
          return method.apply(this, args);
        };
        wrapped = true;
      }

      if (wrapped) {
        ObjectDefineProperty(this.prototype, key, next);
      }
    }
  }
}

const ParentNodePrototype = _.webidl.createBranded(ParentNode.prototype);
