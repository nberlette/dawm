import {
  _,
  ArrayPrototypeJoin,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  indexOf,
  mixin,
  type NodeOfType,
  ObjectDefineProperties,
  ObjectDefineProperty,
  ObjectGetOwnPropertyDescriptor,
  ObjectGetOwnPropertyDescriptors,
  splice,
  StringPrototypeIncludes,
  StringPrototypeSplit,
  StringPrototypeToLowerCase,
  XHTML_NAMESPACE,
} from "dawm-internal";
import { NODE_CONSTANTS_MIXIN } from "./_node_constants.ts";
import { clone_shallow, node_type } from "dawm-internal/keys";
import type { Keys } from "dawm-internal/types";

import { NodeList, NodeListOf } from "./collections/NodeList.ts";
import { EventTarget } from "./events/EventTarget.ts";
import { Event } from "./events/Event.ts";

import { type DOMNode, NodeType } from "./types.ts";
import type { Document } from "./Document.ts";
import type { Element } from "./Element.ts";
import { DOMException } from "./DOMException.ts";

declare module "dawm-internal" {
  export interface NodeInternal {
    create<T extends typeof Node>(
      ctor: T,
      nodeName: string,
      nodeValue: string | null,
      parentNode?: Node | null,
      firstChild?: Node | null,
      nextSibling?: Node | null,
    ): InstanceType<T>;

    getId<T extends Node>(node: T): string | null;
    setId<T extends Node>(node: T, value: string | null): T;
    getBaseURI<T extends Node>(node: T): string | null;
    setBaseURI<T extends Node>(node: T, value: string | null): T;
    getNodeName<T extends Node>(node: T): string;
    setNodeName<T extends Node>(node: T, value: string): T;
    getNodeValue<T extends Node>(node: T): string | null;
    setNodeValue<T extends Node>(node: T, value: string | null): T;
    getNamespaceURI<T extends Node>(node: T): string | null;
    setNamespaceURI<T extends Node>(node: T, value: string | null): T;
    getParentNode<T extends Node>(node: T): Node | null;
    setParentNode<T extends Node>(node: T, value: Node | null): T;
    getFirstChild<T extends Node>(node: T): Node | null;
    setFirstChild<T extends Node>(node: T, value: Node | null): T;
    getLastChild<T extends Node>(node: T): Node | null;
    setLastChild<T extends Node>(node: T, value: Node | null): T;
    getPreviousSibling<T extends Node>(node: T): Node | null;
    setPreviousSibling<T extends Node>(node: T, value: Node | null): T;
    getNextSibling<T extends Node>(node: T): Node | null;
    setNextSibling<T extends Node>(node: T, value: Node | null): T;
    getOwnerDocument<T extends Node>(node: T): Document | null;
    setOwnerDocument<T extends Node>(node: T, value: Document | null): T;
    getChildNodes<T extends Node>(node: T): NodeListOf<Node> | null;
    setChildNodes<T extends Node>(node: T, value: NodeListOf<Node> | null): T;
  }

  export interface internal {
    Node: NodeInternal;
  }
}

declare module "dawm-webidl/converters" {
  export interface NodeConverterOptions<
    T extends NodeType = NodeType,
  > extends ConverterOptions {
    nodeType?: T;
  }

  export interface Converters {
    "Node"<T extends NodeType>(
      base: unknown,
      ...args: ConverterRestArgs<NodeConverterOptions<T>>
    ): NodeOfType<T>;
    "Node?"<T extends NodeType>(
      base: unknown,
      ...args: ConverterRestArgs<NodeConverterOptions<T>>
    ): NodeOfType<T> | null;
  }
}

_.webidl.converters.Node = function (V, ...args) {
  const O = _.webidl.util.toConverterOptions(args, {
    context: "The provided value",
  });
  if (V == null || !_.isNode(V)) {
    throw _.webidl.exception({
      header: "Failed to convert value to 'Node'",
      message: `${O.context} is not a Node.`,
    });
  }
  if (O.nodeType) {
    const typeName = NodeType.toString(O.nodeType);
    const header = `Failed to convert value to '${typeName}'`;
    if (V.nodeType !== O.nodeType) {
      throw _.webidl.exception({
        header,
        message:
          `Expected a nodeType of ${O.nodeType} (${typeName}), but found ${V.nodeType} (${
            NodeType.toString(V.nodeType)
          }) instead.`,
      });
    }
  }
  return V as never;
};

_.webidl.converters["Node?"] = _.webidl.convert.nullable(
  _.webidl.converters.Node,
) as never;

const NodeBase = mixin(EventTarget, NODE_CONSTANTS_MIXIN);
type NodeBaseConstructor = typeof NodeBase;
type NodeBase = InstanceType<NodeBaseConstructor>;

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
export abstract class Node extends NodeBase {
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

  #nodeName: string = "";
  #nodeValue: string | null = null;
  #namespaceURI: string | null = null;
  #parentNode: Node | null = null;
  #firstChild: Node | null = null;
  #lastChild: Node | null = null;
  #previousSibling: Node | null = null;
  #nextSibling: Node | null = null;
  #ownerDocument: Document | null = null;
  #childNodes: NodeListOf<Node> | null = null;
  #id: string | null = null;
  #baseURI: string | null = null;

  protected abstract [clone_shallow](): Node;

  get [node_type](): NodeType {
    return this.nodeType;
  }

  constructor() {
    super();

    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: Node,
      abstract: true,
    });
  }

  #getChildNodes = () => {
    const children: Node[] = [];
    let lastChild: Node | null = null;
    for (
      let child = this.firstChild;
      child != null;
      lastChild = child, child = child?.nextSibling ?? null
    ) {
      _.Node.setParentNode(child, this);
      _.Node.setPreviousSibling(child, lastChild);
      ArrayPrototypePush(children, child);
    }
    this.#lastChild = lastChild;
    return children;
  };

  get id(): string {
    return this.#id ?? "";
  }

  set id(id: string | null | undefined) {
    this.#id = id || null;
  }

  get nodeName(): string {
    return this.#nodeName;
  }

  set nodeName(value: string) {
    this.#nodeName = value;
  }

  get nodeValue(): string | null {
    return this.#nodeValue;
  }

  set nodeValue(value: string | null) {
    this.#nodeValue = value;
  }

  get namespaceURI(): string | null {
    return this.#namespaceURI;
  }

  set namespaceURI(value: string | null) {
    this.#namespaceURI = value;
  }

  get parentNode(): Node | null {
    return this.#parentNode;
  }

  set parentNode(value: Node | null) {
    this.#parentNode = value;
  }

  get firstChild(): Node | null {
    return this.#firstChild;
  }

  set firstChild(value: Node | null) {
    this.#firstChild = value;
  }

  get lastChild(): Node | null {
    return this.#lastChild;
  }

  set lastChild(value: Node | null) {
    this.#lastChild = value;
  }

  get previousSibling(): Node | null {
    return this.#previousSibling;
  }

  set previousSibling(value: Node | null) {
    this.#previousSibling = value;
  }

  get nextSibling(): Node | null {
    return this.#nextSibling;
  }

  set nextSibling(value: Node | null) {
    this.#nextSibling = value;
  }

  get ownerDocument(): Document | null {
    _.webidl.assertBranded(this, NodePrototype);
    return this.#ownerDocument;
  }

  set ownerDocument(value: Document | null) {
    _.webidl.assertBranded(this, NodePrototype);
    this.#ownerDocument = value;
  }

  get childNodes(): NodeListOf<Node> {
    _.webidl.assertBranded(this, NodePrototype);
    return this.#childNodes ??= _.NodeList.new(
      this,
      this.#getChildNodes(),
      this.#getChildNodes,
    );
  }

  get baseURI(): string {
    if (this.#baseURI) return this.#baseURI;
    if (this.ownerDocument && this.ownerDocument !== (this as never)) {
      return this.#baseURI = this.ownerDocument.baseURI;
    }
    return "about:blank";
  }

  get localName(): string {
    _.webidl.assertBranded(this, NodePrototype);
    if (StringPrototypeIncludes(this.nodeName, ":")) {
      const lower = StringPrototypeToLowerCase(this.nodeName);
      const split = StringPrototypeSplit(lower, /:/);
      const tail = ArrayPrototypeSlice(split, 1);
      return ArrayPrototypeJoin(tail, ":");
    }
    return StringPrototypeToLowerCase(this.nodeName);
  }

  get prefix(): string | null {
    _.webidl.assertBranded(this, NodePrototype);
    const prefix = this.namespaceURI && this.lookupPrefix(this.namespaceURI);
    if (prefix) return prefix;
    if (this.nodeName.includes(":")) {
      return this.nodeName.toLowerCase().split(/:/).slice(0, 1).join(":");
    }
    return null;
  }

  get parentElement(): Element | null {
    _.webidl.assertBranded(this, NodePrototype);
    return this.parentNode?.nodeType === NodeType.Element
      ? this.parentNode as Element
      : null;
  }

  get textContent(): string | null {
    _.webidl.assertBranded(this, NodePrototype);
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
    _.webidl.assertBranded(this, NodePrototype);
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
    _.webidl.assertBranded(this, NodePrototype);
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
    _.webidl.assertBranded(this, NodePrototype);
    this.textContent = value;
  }

  get isConnected(): boolean {
    _.webidl.assertBranded(this, NodePrototype);
    // deno-lint-ignore no-this-alias
    let node: Node | null = this;
    while (node) {
      if (node.nodeType === NodeType.Document) return true;
      node = node.parentNode;
    }
    return false;
  }

  hasChildNodes(): boolean {
    _.webidl.assertBranded(this, NodePrototype);
    return this.firstChild !== null;
  }

  insertBefore<TNode extends Node>(
    newChild: TNode,
    refChild: Node | null,
  ): TNode {
    _.webidl.assertBranded(this, NodePrototype);
    _.webidl.assertBranded(newChild, NodePrototype);
    if (refChild) _.webidl.assertBranded(refChild, NodePrototype);

    if (newChild === refChild) return newChild;
    if (refChild && refChild.parentNode !== this) {
      throw new DOMException(
        "The reference node is not a child of this node.",
        "HierarchyRequestError",
      );
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

    if (previousSibling) previousSibling.#nextSibling = newChild;
    if (nextSibling) nextSibling.#previousSibling = newChild;

    newChild.#previousSibling = previousSibling;
    newChild.#nextSibling = nextSibling;
    newChild.#parentNode = this;
    newChild.#ownerDocument = this.ownerDocument;

    this.#firstChild = children[0] ?? null;
    this.#lastChild = children[children.length - 1] ?? null;

    return newChild;
  }

  appendChild<TNode extends Node>(newChild: TNode): TNode {
    _.webidl.assertBranded(this, NodePrototype);
    _.webidl.assertBranded(newChild, NodePrototype);
    return this.insertBefore(newChild, null);
  }

  replaceChild<TChild extends Node, TNode extends Node>(
    newChild: TChild,
    oldChild: TNode,
  ): TNode {
    _.webidl.assertBranded(this, NodePrototype);
    _.webidl.assertBranded(oldChild, NodePrototype);
    if (oldChild.parentNode && oldChild.parentNode !== this) {
      throw new DOMException(
        "The node to be replaced is not a child of this node.",
        "HierarchyRequestError",
      );
    }
    this.insertBefore(newChild, oldChild);
    return this.removeChild(oldChild);
  }

  removeChild<TNode extends Node>(oldChild: TNode): TNode {
    _.webidl.assertBranded(this, NodePrototype);
    const index = indexOf(this.childNodes, oldChild);
    if (index === -1) {
      throw new DOMException(
        "The node to be removed is not a child of this node.",
        "NotFoundError",
      );
    }
    splice(this.childNodes, index, 1);
    const prev = oldChild.previousSibling;
    const next = oldChild.nextSibling;
    if (prev) prev.#nextSibling = next;
    if (next) next.#previousSibling = prev;
    if (this.#firstChild === oldChild) this.#firstChild = next;
    if (this.#lastChild === oldChild) this.#lastChild = prev;
    oldChild.#parentNode = null;
    oldChild.#previousSibling = null;
    oldChild.#nextSibling = null;
    return oldChild;
  }

  cloneNode(deep = false): Node {
    _.webidl.assertBranded(this, NodePrototype);
    const clone = this[clone_shallow]();
    if (deep) {
      for (let child = this.firstChild; child; child = child.nextSibling) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }

  normalize(): void {
    _.webidl.assertBranded(this, NodePrototype);
    let child = this.firstChild;
    while (child) {
      if (child.nodeType === NodeType.Text) {
        let cursor = child.nextSibling;
        while (cursor && cursor.nodeType === NodeType.Text) {
          child.nodeValue = (child.nodeValue ?? "") + (cursor.nodeValue ?? "");
          const toRemove = cursor;
          cursor = cursor.nextSibling;
          this.removeChild(toRemove);
        }
        const next = child.nextSibling;
        if (!child.nodeValue) this.removeChild(child);
        child = next;
        continue;
      } else if (typeof child.normalize === "function") {
        child.normalize();
      }
      child = child.nextSibling;
    }
  }

  isEqualNode(otherNode: Node | null): boolean {
    _.webidl.assertBranded(this, NodePrototype);
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
    _.webidl.assertBranded(this, NodePrototype);
    return this === otherNode;
  }

  lookupPrefix(namespace: string | null): string | null {
    _.webidl.assertBranded(this, NodePrototype);
    // TODO: implement spec-compliant namespaces and prefixes
    if (namespace === null) return null;
    return this.parentNode?.lookupPrefix(namespace) ?? null;
  }

  lookupNamespaceURI(prefix: string | null): string | null {
    _.webidl.assertBranded(this, NodePrototype);
    // TODO: implement spec-compliant namespaces and prefixes
    if (!prefix) return XHTML_NAMESPACE;
    return this.parentNode?.lookupNamespaceURI(prefix) ?? null;
  }

  isDefaultNamespace(namespace: string | null): boolean {
    _.webidl.assertBranded(this, NodePrototype);
    return (this.lookupNamespaceURI(null) ?? null) === namespace;
  }

  getRootNode(_options?: { composed: boolean }): Node {
    _.webidl.assertBranded(this, NodePrototype);
    // deno-lint-ignore no-this-alias
    let node: Node = this;
    while (node.parentNode) node = node.parentNode;
    return node;
  }

  compareDocumentPosition(other: Node): number {
    _.webidl.assertBranded(this, NodePrototype);
    _.webidl.assertBranded(other, NodePrototype);
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
    if (i < 0) return CONTAINS | PRECEDING;
    if (j < 0) return CONTAINED | FOLLOWING;

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

    defineEnumerableFields(this.prototype, [
      "nodeType",
      "localName",
      "parentElement",
      "prefix",
      "baseURI",
      "textContent",
    ]);

    // deno-lint-ignore no-inner-declarations
    function defineEnumerableFields<
      const T extends {},
      const K extends readonly Keys<T, false, true>[],
    >(
      target: T,
      fields: K | readonly Keys<T, true, true>[],
    ): asserts target is
      & T
      & { [P in K[number]]: P extends keyof T ? T[P] : unknown } {
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const desc = ObjectGetOwnPropertyDescriptor(target, field);
        if (desc && desc.configurable && !desc.enumerable) {
          desc.enumerable = true;
          ObjectDefineProperty(target, field, desc);
        }
      }
    }

    const descriptors = ObjectGetOwnPropertyDescriptors(this.prototype);
    for (const key in descriptors) {
      if (key === "constructor") continue;
      const descriptor = descriptors[key]!;
      const next = { ...descriptor };
      let wrapped = false;

      if (typeof descriptor.get === "function") {
        const getter = descriptor.get;
        next.get = function (this: Node) {
          _.webidl.assertBranded(this, NodePrototype);
          return getter.call(this);
        };
        wrapped = true;
      }

      if (typeof descriptor.set === "function") {
        const setter = descriptor.set;
        next.set = function (this: Node, value: unknown) {
          _.webidl.assertBranded(this, NodePrototype);
          return setter.call(this, value);
        };
        wrapped = true;
      }

      if (typeof descriptor.value === "function") {
        const method = descriptor.value;
        next.value = function (this: Node, ...args: unknown[]) {
          _.webidl.assertBranded(this, NodePrototype);
          return method.apply(this, args);
        };
        wrapped = true;
      }

      if (wrapped) {
        ObjectDefineProperty(this.prototype, key, next);
      }
    }
  }

  static {
    _.Node = {
      create(Ctor, nodeName, nodeValue, parentNode, firstChild, nextSibling) {
        const node = new (Ctor as any)(_.keys._private);
        _.Node.setNodeName(node, nodeName);
        _.Node.setNodeValue(node, nodeValue);
        _.Node.setParentNode(node, parentNode ?? null);
        _.Node.setFirstChild(node, firstChild ?? null);
        _.Node.setNextSibling(node, nextSibling ?? null);
        // node.#nodeName = nodeName;
        // node.#nodeValue = nodeValue ?? null;
        // node.#parentNode = parentNode ?? null;
        // node.#firstChild = firstChild ?? null;
        // node.#nextSibling = nextSibling ?? null;
        if (nextSibling) {
          _.Node.setPreviousSibling(nextSibling, node);
          if (parentNode) {
            _.Node.setParentNode(nextSibling, parentNode);
          } else if (nextSibling.parentNode) {
            _.Node.setParentNode(node, parentNode = nextSibling.parentNode);
          } else {
            throw new DOMException(
              "Cannot set nextSibling without a parentNode.",
              "HierarchyRequestError",
            );
          }
        }
        if (firstChild) {
          _.Node.setParentNode(firstChild, node);
          _.Node.setFirstChild(node, firstChild);
          const childNodes = _.NodeList.new(node, node.#getChildNodes);
          _.Node.setChildNodes(node, childNodes);
        }
        return node;
      },
      getId: (n) => n.#id,
      setId: (n, v) => (n.#id = v, n),
      getBaseURI: (n) => n.#baseURI,
      setBaseURI: (n, v) => (n.#baseURI = v, n),
      getNodeName: (n) => n.#nodeName,
      setNodeName: (n, v) => (n.#nodeName = v, n),
      getNodeValue: (n) => n.#nodeValue,
      setNodeValue: (n, v) => (n.#nodeValue = v, n),
      getNamespaceURI: (n) => n.#namespaceURI,
      setNamespaceURI: (n, v) => (n.#namespaceURI = v, n),
      getParentNode: (n) => n.#parentNode,
      setParentNode: (n, v) => (n.#parentNode = v, n),
      getFirstChild: (n) => n.#firstChild,
      setFirstChild: (n, v) => (n.#firstChild = v, n),
      getLastChild: (n) => n.#lastChild,
      setLastChild: (n, v) => (n.#lastChild = v, n),
      getPreviousSibling: (n) => n.#previousSibling,
      setPreviousSibling: (n, v) => (n.#previousSibling = v, n),
      getNextSibling: (n) => n.#nextSibling,
      setNextSibling: (n, v) => (n.#nextSibling = v, n),
      getOwnerDocument: (n) => n.#ownerDocument,
      setOwnerDocument: (n, v) => (n.#ownerDocument = v, n),
      getChildNodes: (n) => n.#childNodes,
      setChildNodes: (n, v) => (n.#childNodes = v, n),
    };
  }
}

const NodePrototype = _.webidl.createBranded(Node.prototype);
