import { _ } from "../_internal.ts";
import { indexOf, splice } from "../internal/collection_helpers.ts";
import { clone_shallow, node_type } from "../internal/keys.ts";
import { mixin } from "../internal/mixin.ts";
import {
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptors,
} from "../internal/primordials.ts";
import { NODE_CONSTANTS_MIXIN, XHTML_NAMESPACE } from "./_common.ts";

import { NodeList, NodeListOf } from "../collections/index.ts";
import { type DOMNode, NodeType } from "./types.ts";
import type { Document } from "./Document.ts";
import type { Element } from "./Element.ts";

/**
 * Represents a Node as defined by the DOM Standard.
 *
 * This is the abstract superclass that serves as a common ancestor for all of
 * the specialized Node types found in a DOM tree, such as `Element`, `Attr`,
 * `Text`, `CDATASection`, `Comment`, `Document`, and so on.
 *
 * IMPORTANT: Since `Node` is an abstract class, attempting to instantiate it
 * via `new Node` or `Reflect.construct(Node, ...)` will result in a TypeError
 * being thrown. Instead, obtain a reference to a `Document` instance by using
 * dawm's XML/HTML parser - or via {@linkcode DOMImplementation} - which can
 * then be used to create nodes of the desired type. For example, an `Element`
 * can be created with {@linkcode Document.createElement}, a disconnected
 * `Attr` with {@linkcode Document.createAttr}, and a `Text` node with the
 * {@linkcode Document.createTextNode} method. Refer to the [MDN Reference]
 * for more information on this pattern.
 *
 * [MDN Reference]: https://mdn.io/Node
 *
 * @see {@linkcode WireNode} for the raw wire format
 * @see {@linkcode ResolvedWireNode} for the intermediate resolved format.
 * @see {@linkcode Element} for element-specific properties and methods.
 * @see {@linkcode Attr} for attribute-specific properties and methods.
 * @see {@linkcode Document} for document-specific properties and methods.
 * @see {@linkcode Text} for text node-specific properties and methods.
 * @abstract
 * @category DOM
 * @tags Node
 */
export abstract class Node extends mixin(EventTarget, NODE_CONSTANTS_MIXIN)
  implements DOMNode {
  static #__id = 0;

  static readonly ELEMENT_NODE = 1;
  static readonly ATTRIBUTE_NODE = 2;
  static readonly TEXT_NODE = 3;
  static readonly CDATA_SECTION_NODE = 4;
  static readonly ENTITY_REFERENCE_NODE = 5;
  static readonly ENTITY_NODE = 6;
  static readonly PROCESSING_INSTRUCTION_NODE = 7;
  static readonly COMMENT_NODE = 8;
  static readonly DOCUMENT_NODE = 9;
  static readonly DOCUMENT_TYPE_NODE = 10;
  static readonly DOCUMENT_FRAGMENT_NODE = 11;
  static readonly NOTATION_NODE = 12;

  static readonly DOCUMENT_POSITION_DISCONNECTED = 0x01;
  static readonly DOCUMENT_POSITION_PRECEDING = 0x02;
  static readonly DOCUMENT_POSITION_FOLLOWING = 0x04;
  static readonly DOCUMENT_POSITION_CONTAINS = 0x08;
  static readonly DOCUMENT_POSITION_CONTAINED_BY = 0x10;
  static readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;

  abstract readonly nodeType: NodeType;

  nodeName: string;
  nodeValue: string | null;
  namespaceURI: string | null = null;
  parentNode: Node | null = null;
  firstChild: Node | null = null;
  lastChild: Node | null = null;
  previousSibling: Node | null = null;
  nextSibling: Node | null = null;
  ownerDocument: Document | null = null;

  readonly childNodes: NodeListOf<Node>;

  protected abstract [clone_shallow](): Node;

  get [node_type](): NodeType {
    return this.nodeType;
  }

  #id: string | null = null;
  #baseURI: string | null = null;
  #$id = "";

  constructor(
    nodeName: string,
    nodeValue: string | null,
    parentNode?: Node | null,
    firstChild?: Node | null,
    nextSibling?: Node | null,
  ) {
    super();

    this.#$id = `node-${++Node.#__id}`;
    this.nodeName = nodeName;
    this.nodeValue = nodeValue ?? null;

    if (parentNode) this.parentNode = parentNode;
    if (nextSibling) {
      this.nextSibling = nextSibling;
      nextSibling.previousSibling = this;
      nextSibling.parentNode = parentNode ?? null;
    }
    const children: Node[] = [];
    this.firstChild = firstChild ?? null;
    let child: Node | null = this.firstChild;
    let lastChild: Node | null = null;
    while (child) {
      child.parentNode = this;
      child.previousSibling = lastChild;
      children.push(child);
      child = (lastChild = child).nextSibling;
    }
    this.lastChild = lastChild;
    this.childNodes = new NodeList(this, children);
  }

  static {
    _.define("setGlobalNodeId", (id) => Node.#__id = id);
  }

  get id(): string {
    return this.#id ?? "";
  }

  set id(id: string | null | undefined) {
    this.#id = id || null;
  }

  get baseURI(): string {
    if (this.#baseURI) return this.#baseURI;
    if (this.ownerDocument && this.ownerDocument !== (this as never)) {
      return this.#baseURI = this.ownerDocument.baseURI;
    }
    return "about:blank";
  }

  get localName(): string {
    if (this.nodeName.includes(":")) {
      return this.nodeName.toLowerCase().split(/:/).slice(1).join(":");
    }
    return this.nodeName.toLowerCase();
  }

  get prefix(): string | null {
    const prefix = this.namespaceURI && this.lookupPrefix(this.namespaceURI);
    if (prefix) return prefix;
    if (this.nodeName.includes(":")) {
      return this.nodeName.toLowerCase().split(/:/).slice(0, 1).join(":");
    }
    return null;
  }

  get parentElement(): Element | null {
    return this.parentNode?.nodeType === NodeType.Element
      ? this.parentNode as Element
      : null;
  }

  get textContent(): string | null {
    switch (this.nodeType) {
      case NodeType.Document:
      case NodeType.DocumentFragment:
      case NodeType.Element: {
        if (this.childNodes.length === 0) return "";
        let out = "";
        for (const child of this.childNodes) {
          out += child.textContent ?? "";
        }
        return out;
      }
      default:
        break;
    }
    return this.nodeValue ?? "";
  }

  set textContent(value: string | null) {
    const normalized = value ?? "";
    if (
      this.nodeType === NodeType.Document ||
      this.nodeType === NodeType.DocumentFragment ||
      this.nodeType === NodeType.Element
    ) {
      while (this.firstChild) this.removeChild(this.firstChild);
      if (normalized && this.ownerDocument) {
        this.appendChild(this.ownerDocument.createTextNode(normalized));
      }
    } else {
      this.nodeValue = normalized;
    }
  }

  get innerText(): string {
    let text = "";
    for (let n = this.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === NodeType.Text) {
        text += n.nodeValue ?? "";
      } else if (
        n.nodeType === NodeType.Element ||
        n.nodeType === NodeType.DocumentFragment ||
        n.nodeType === NodeType.Document
      ) {
        text += n.innerText;
      }
    }
    return text;
  }

  set innerText(value: string) {
    this.textContent = value;
  }

  get isConnected(): boolean {
    // deno-lint-ignore no-this-alias
    let node: Node | null = this;
    while (node) {
      if (node.nodeType === NodeType.Document) return true;
      node = node.parentNode;
    }
    return false;
  }

  hasChildNodes(): boolean {
    return this.childNodes.length > 0;
  }

  insertBefore<TNode extends Node>(
    newChild: TNode,
    refChild: Node | null,
  ): TNode {
    if (newChild === refChild) return newChild;
    if (refChild && refChild.parentNode !== this) {
      throw new Error("Reference node is not a child of this node.");
    }

    if (newChild.nodeType === NodeType.DocumentFragment) {
      for (const child of newChild.childNodes) {
        this.insertBefore(child, refChild);
      }
      return newChild;
    }

    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }

    const children = this.childNodes;
    const index = refChild ? indexOf(children, refChild) : children.length;
    if (refChild && index === -1) {
      throw new Error("Reference node is not a child of this node.");
    }

    const previousSibling = refChild
      ? refChild.previousSibling
      : children[children.length - 1] ?? null;
    const nextSibling = refChild ?? null;

    splice(children, index, 0, newChild);

    if (previousSibling) previousSibling.nextSibling = newChild;
    if (nextSibling) nextSibling.previousSibling = newChild;

    newChild.previousSibling = previousSibling;
    newChild.nextSibling = nextSibling;
    newChild.parentNode = this;
    newChild.ownerDocument = this.ownerDocument;

    this.firstChild = children[0] ?? null;
    this.lastChild = children[children.length - 1] ?? null;

    return newChild;
  }

  appendChild<TNode extends Node>(newChild: TNode): TNode {
    return this.insertBefore(newChild, null);
  }

  replaceChild<TChild extends Node, TNode extends Node>(
    newChild: TChild,
    oldChild: TNode,
  ): TNode {
    if (oldChild.parentNode && oldChild.parentNode !== this) {
      throw new Error("The node to be replaced is not a child of this node.");
    }
    this.insertBefore(newChild, oldChild);
    return this.removeChild(oldChild);
  }

  removeChild<TNode extends Node>(oldChild: TNode): TNode {
    const index = indexOf(this.childNodes, oldChild);
    if (index === -1) {
      throw new Error("The node to be removed is not a child of this node.");
    }
    splice(this.childNodes, index, 1);
    const prev = oldChild.previousSibling;
    const next = oldChild.nextSibling;
    if (prev) prev.nextSibling = next;
    if (next) next.previousSibling = prev;
    if (this.firstChild === oldChild) this.firstChild = next;
    if (this.lastChild === oldChild) this.lastChild = prev;
    oldChild.parentNode = null;
    oldChild.previousSibling = null;
    oldChild.nextSibling = null;
    return oldChild;
  }

  cloneNode(deep = false): Node {
    const clone = this[clone_shallow]();
    if (deep) {
      for (const child of this.childNodes) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  normalize(): void {
    let child = this.firstChild;
    while (child) {
      const next = child.nextSibling;
      if (child.nodeType === NodeType.Text) {
        let cursor = child.nextSibling;
        while (cursor && cursor.nodeType === NodeType.Text) {
          child.nodeValue = (child.nodeValue ?? "") + (cursor.nodeValue ?? "");
          const toRemove = cursor;
          cursor = cursor.nextSibling;
          this.removeChild(toRemove);
        }
        if (!child.nodeValue) this.removeChild(child);
      } else if (typeof child.normalize === "function") {
        child.normalize();
      }
      child = next;
    }
  }

  isEqualNode(otherNode: Node | null): boolean {
    if (!otherNode) return false;
    if (this === otherNode) return true;
    if (this.nodeType !== otherNode.nodeType) return false;
    if (this.nodeName !== otherNode.nodeName) return false;
    if ((this.nodeValue ?? null) !== (otherNode.nodeValue ?? null)) {
      return false;
    }

    if (this.nodeType === NodeType.Element) {
      const $this = this as {} as Element, $that = otherNode as Element;
      const thisAttrs = [...$this.attributes ?? []];
      const thatAttrs = [...$that.attributes ?? []];
      if (thisAttrs.length !== thatAttrs.length) return false;
      for (let i = 0; i < thisAttrs.length; i++) {
        const a = thisAttrs[i], b = thatAttrs[i];
        if (a.name !== b.name || a.value !== b.value) return false;
      }
    }

    if (this.childNodes.length !== otherNode.childNodes.length) return false;
    for (let i = 0; i < this.childNodes.length; i++) {
      if (!this.childNodes[i].isEqualNode(otherNode.childNodes[i])) {
        return false;
      }
    }

    return true;
  }

  isSameNode(otherNode: Node | null): boolean {
    return this === otherNode;
  }

  lookupPrefix(namespace: string | null): string | null {
    // TODO: implement spec-compliant namespaces and prefixes
    if (!namespace) return null;
    return this.parentNode?.lookupPrefix(namespace) ?? null;
  }

  lookupNamespaceURI(prefix: string | null): string | null {
    // TODO: implement spec-compliant namespaces and prefixes
    if (!prefix) return XHTML_NAMESPACE;
    return this.parentNode?.lookupNamespaceURI(prefix) ?? null;
  }

  isDefaultNamespace(namespace: string | null): boolean {
    return (this.lookupNamespaceURI(null) ?? null) === namespace;
  }

  getRootNode(_options?: { composed: boolean }): Node {
    // deno-lint-ignore no-this-alias
    let node: Node = this;
    while (node.parentNode) node = node.parentNode;
    return node;
  }

  compareDocumentPosition(other: Node): number {
    if (this === other) return 0;
    const DISCONNECTED = 0x01;
    const PRECEDING = 0x02;
    const FOLLOWING = 0x04;
    const CONTAINS = 0x08;
    const CONTAINED = 0x10;
    const IMPL_SPEC = 0x20;

    const these: Node[] = [], those: Node[] = [];

    // deno-lint-ignore no-this-alias
    let node: Node | null = this;
    while (node) {
      these.push(node);
      node = node.parentNode;
    }

    node = other;
    while (node) {
      those.push(node);
      node = node.parentNode;
    }

    let i = these.length - 1, j = those.length - 1;
    while (i >= 0 && j >= 0 && these[i] === those[j]) {
      i--;
      j--;
    }

    if (i < 0 && j < 0) return DISCONNECTED;
    if (i < 0) return CONTAINED | FOLLOWING;
    if (j < 0) return CONTAINS | PRECEDING;

    const thisA = these[i], thatA = those[j];

    let sibling: Node | null = thisA;
    while (sibling) {
      if (sibling === thatA) return CONTAINED | FOLLOWING;
      sibling = sibling.previousSibling;
    }

    sibling = thatA;
    while (sibling) {
      if (sibling === thisA) return CONTAINS | PRECEDING;
      sibling = sibling.previousSibling;
    }

    return IMPL_SPEC;
  }

  static {
    const props = ObjectGetOwnPropertyDescriptors(NODE_CONSTANTS_MIXIN);
    ObjectDefineProperties(this, props);
    ObjectDefineProperties(this.prototype, props);
    ObjectDefineProperties(this.prototype, {
      nodeType: { enumerable: true },
      localName: { enumerable: true },
      parentElement: { enumerable: true },
      prefix: { enumerable: true },
      baseURI: { enumerable: true },
      textContent: { enumerable: true },
    });
  }
}
