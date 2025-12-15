import {
  indexOf,
  isInteger,
  isObject,
  ObjectDefineProperties,
  push,
  splice,
  XMLNS_NAMESPACE,
} from "./_internal.ts";
import {
  createHTMLCollection,
  createNamedNodeMap,
  DOMStringMap,
  DOMTokenList,
  type HTMLCollection,
  type HTMLCollectionOf,
  type NamedNodeMap,
  NodeList,
  NodeListOf,
} from "./collections.ts";
import querySelectorAll, { querySelector } from "./select.ts";
import { serializeHTML } from "./serialize.ts";
import { NodeType } from "./wasm/index.js";
import { parseFragment, parseHTML, parseXML } from "./parse.ts";
import type { FragmentParseOptions, ParseOptions } from "./options.ts";

// @ts-types="./wasm/index.d.ts"
export { NodeType, QuirksMode } from "./wasm/index.js";

export type QuirksModeType = "no-quirks" | "quirks" | "limited-quirks";

/**
 * Common ancestor type shared by all {@linkcode Node}-like interfaces.
 *
 * @category Types
 * @tags Node
 */
export interface NodeLike {
  readonly nodeType: NodeType;
}

// #region guards
export function isNodeLike(
  it: unknown,
): it is NodeLike {
  return (
    isObject(it) &&
    "nodeType" in it && isInteger(it.nodeType) && it.nodeType in NodeType
  );
}
// #endregion guards

// #region Concrete Types

/**
 * Represents a DOM Node as defined by the DOM Standard.
 *
 * This is the final, high-level structure produced by the `dawm` parser,
 * after multiple post-processing steps are applied to reconstruct the
 * hierarchical tree-like structure of the original DOM document.
 *
 * @see {@linkcode WireNode} for the raw wire format
 * @see {@linkcode ResolvedWireNode} for the intermediate resolved format.
 * @see {@linkcode Element} for element-specific properties and methods.
 * @see {@linkcode Attr} for attribute-specific properties and methods.
 * @see {@linkcode Document} for document-specific properties and methods.
 * @see {@linkcode Text} for text node-specific properties and methods.
 * @abstract
 * @category Types
 * @tags DOM, Node
 */
export abstract class Node {
  static #__id = 0;

  abstract readonly nodeType: NodeType;

  #baseURI: string | null = null;

  readonly id: string;
  nodeName: string;
  nodeValue: string | null;
  namespaceURI: string | null = null;
  parentNode: Node | null = null;
  firstChild: Node | null = null;
  lastChild: Node | null = null;
  previousSibling: Node | null = null;
  nextSibling: Node | null = null;
  ownerDocument: Document | null = null;
  attributes: NamedNodeMap | null = null;
  readonly childNodes: NodeListOf<Node>;

  constructor(
    nodeName: string,
    nodeValue: string | null,
    parentNode?: Node | null,
    firstChild?: Node | null,
    nextSibling?: Node | null,
  ) {
    this.id = `node-${++Node.#__id}`;
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

  get baseURI(): string {
    if (this.#baseURI) return this.#baseURI;
    if (this.ownerDocument && this.ownerDocument !== (this as never)) {
      return this.#baseURI = this.ownerDocument.baseURI;
    }
    return "about:blank";
  }

  get localName(): string {
    if (this.nodeName.includes(":")) {
      return this.nodeName.split(/:/).slice(1).join(":");
    }
    return this.nodeName;
  }

  get prefix(): string | null {
    if (this.nodeName.includes(":")) {
      return this.nodeName.split(/:/).slice(0, 1).join(":");
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
      if (normalized) this.appendChild(new Text(normalized));
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

  get innerHTML(): string {
    let html = "";
    for (let n = this.firstChild; n; n = n.nextSibling) {
      if ("outerHTML" in n) html += n.outerHTML;
    }
    return html;
  }

  set innerHTML(value: string) {
    let tagName = "div";
    if (this.nodeType === NodeType.Element) {
      tagName = (this as unknown as Element).tagName;
    }
    const fragment = parseFragment(value, tagName);
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    for (const node of fragment.childNodes) {
      this.appendChild(node.cloneNode(true));
    }
  }

  get outerHTML(): string {
    return serializeHTML(this);
  }

  set outerHTML(value: string) {
    if (!this.parentNode) {
      throw new TypeError("Cannot set outerHTML on a disconnected element.");
    }
    const ast = parseFragment(value, this.parentElement?.tagName || "div");
    const node = ast.firstChild?.firstChild?.cloneNode(true);
    if (!node) throw new Error("Failed to parse HTML fragment.");
    this.parentNode.replaceChild(node, this);
  }

  hasChildNodes(): boolean {
    return this.childNodes.length > 0;
  }

  insertBefore(newChild: Node, refChild: Node | null): Node {
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
    newChild.ownerDocument = this.nodeType === NodeType.Document
      ? this as unknown as Document
      : this.ownerDocument;

    this.firstChild = children[0] ?? null;
    this.lastChild = children[children.length - 1] ?? null;

    return newChild;
  }

  appendChild(newChild: Node): Node {
    return this.insertBefore(newChild, null);
  }

  replaceChild(newChild: Node, oldChild: Node): Node {
    if (oldChild.parentNode && oldChild.parentNode !== this) {
      throw new Error("The node to be replaced is not a child of this node.");
    }
    this.insertBefore(newChild, oldChild);
    return this.removeChild(oldChild);
  }

  removeChild(oldChild: Node): Node {
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
    const clone = this.cloneShallow();
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

    const thisAttrs = this.attributes ? [...this.attributes] : [];
    const otherAttrs = [...otherNode.attributes ?? []];
    if (thisAttrs.length !== otherAttrs.length) return false;
    for (let i = 0; i < thisAttrs.length; i++) {
      const a = thisAttrs[i], b = otherAttrs[i];
      if (a.name !== b.name || a.value !== b.value) return false;
    }

    if (this.childNodes.length !== otherNode.childNodes.length) return false;
    for (let i = 0; i < this.childNodes.length; i++) {
      if (!this.childNodes[i].isEqualNode(otherNode.childNodes[i])) {
        return false;
      }
    }

    return true;
  }

  lookupPrefix(namespace: string | null): string | null {
    if (!namespace) return null;
    if (this.nodeType === NodeType.Element && this.attributes) {
      for (const attr of this.attributes as unknown as Attr[]) {
        if (attr.namespaceURI === XMLNS_NAMESPACE && attr.value === namespace) {
          const [_prefix, local] = attr.name.split(":");
          if (local) return local;
          if (attr.name === "xmlns") return "";
        }
      }
    }
    return this.parentNode?.lookupPrefix(namespace) ?? null;
  }

  lookupNamespaceURI(prefix: string | null): string | null {
    if (this.nodeType === NodeType.Element && this.attributes) {
      for (const attr of this.attributes as unknown as Attr[]) {
        if (attr.namespaceURI === XMLNS_NAMESPACE) {
          if (prefix === null && attr.name === "xmlns") {
            return attr.value;
          }
          const parts = attr.name.split(":");
          if (prefix && parts.length === 2 && parts[1] === prefix) {
            return attr.value;
          }
        }
      }
    }
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

  querySelector<T extends Element>(selectors: string): T | null {
    return querySelector(this, selectors);
  }

  querySelectorAll<T extends Element>(selectors: string): NodeListOf<T> {
    const elements = querySelectorAll(this, selectors);
    return new NodeList(this, elements) as NodeListOf<T>;
  }

  protected abstract cloneShallow(): Node;
}

/**
 * Represents a DOM Attr as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds a
 * subset of the attribute-specific properties and methods found in the DOM
 * specification, which focus on implementing the behavior of attribute nodes
 * and their relationships to element nodes.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode Element} for the element-specific properties and methods.
 * @category Types
 * @tags DOM, Attribute
 */
export class Attr extends Node {
  constructor(
    name: string,
    value: string,
    namespaceURI?: string | null,
    ownerElement?: Element | null,
  ) {
    super(name, value);
    this.namespaceURI = namespaceURI ?? null;
    this.ownerElement = ownerElement ?? null;
  }

  ownerElement: Element | null = null;

  get nodeType(): NodeType.Attribute {
    return NodeType.Attribute;
  }

  get specified(): boolean {
    return true;
  }

  get name(): string {
    return this.nodeName;
  }

  get value(): string {
    return this.nodeValue ?? "";
  }

  set value(v: string) {
    this.nodeValue = v;
  }

  protected cloneShallow(): Attr {
    const clone = new Attr(this.nodeName, this.value, this.namespaceURI);
    return clone;
  }

  override cloneNode(): Attr {
    const clone = this.cloneShallow();
    clone.ownerElement = this.ownerElement;
    return clone;
  }
}

/**
 * Represents a DOM Element as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds a
 * subset of the element-specific properties and methods found in the DOM
 * specification, which focus on implementing the behavior of element nodes,
 * their attributes, and their relationships to the rest of the document tree.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, Element
 */
export class Element extends Node {
  readonly tagName: string;
  override readonly attributes: NamedNodeMap;

  constructor(
    tagName: string,
    attrs: Attr[] = [],
    parentNode?: Node | null,
    firstChild?: Node | null,
    nextSibling?: Node | null,
  ) {
    super(tagName, null);
    this.tagName = tagName.toUpperCase();
    this.attributes = createNamedNodeMap(this, attrs);
    for (const attr of attrs) attr.ownerElement = this;
    this.parentNode = parentNode ?? null;
    this.firstChild = firstChild ?? null;
    this.nextSibling = nextSibling ?? null;
  }

  get nodeType(): NodeType.Element {
    return NodeType.Element;
  }

  get isSelfClosing(): boolean {
    const selfClosingTags = new Set([
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ]);
    return selfClosingTags.has(this.tagName.toLowerCase());
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
    let count = 0;
    for (const child of this.childNodes) {
      if (child.nodeType === NodeType.Element) count++;
    }
    return count;
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
      const elements = [];
      for (let n = this.firstElementChild; n; n = n.nextElementSibling) {
        elements.push(n);
      }
      return elements;
    }, "children");
  }

  get className(): string {
    return this.getAttribute("class") ?? "";
  }

  set className(value: string) {
    this.setAttribute("class", value);
  }

  get classList(): DOMTokenList {
    return new DOMTokenList(this, "class");
  }

  get dataset(): DOMStringMap {
    return new DOMStringMap(this);
  }

  getAttribute(name: string): string | null {
    return this.getAttributeNode(name)?.value ?? null;
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return this.getAttributeNodeNS(namespace, localName)?.value ?? null;
  }

  setAttribute(name: string, value: string): void {
    const attr = new Attr(name, value, null);
    this.setAttributeNode(attr);
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string,
  ): void {
    const attr = new Attr(qualifiedName, value, namespace ?? null);
    attr.namespaceURI = namespace ?? null;
    this.setAttributeNode(attr);
  }

  removeAttribute(name: string): void {
    const attr = this.getAttributeNode(name);
    if (!attr) throw new Error("Attribute not found");
    this.removeAttributeNode(attr);
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    for (const attr of this.attributes) {
      if (attr.namespaceURI === namespace && attr.localName === localName) {
        this.removeAttributeNode(attr);
      }
    }
  }

  hasAttribute(name: string): boolean {
    return this.getAttributeNode(name) != null;
  }

  hasAttributes(): boolean {
    return this.attributes.length > 0;
  }

  hasAttributeNS(namespace: string | null, localName: string): boolean {
    return this.getAttributeNodeNS(namespace, localName) != null;
  }

  getAttributeNames(): string[] {
    const names: string[] = [];
    for (const attr of this.attributes) {
      names.push(attr.name);
    }
    return names;
  }

  getAttributeNode(name: string): Attr | null {
    for (const attr of this.attributes) {
      if (attr.name === name) return attr;
    }
    return null;
  }

  getAttributeNodeNS(
    namespace: string | null,
    localName: string,
  ): Attr | null {
    for (const attr of this.attributes) {
      if (
        (attr.namespaceURI ?? null) === (namespace ?? null) &&
        attr.localName === localName
      ) {
        return attr;
      }
    }
    return null;
  }

  setAttributeNode(attr: Attr): Attr | null {
    const existing = this.getAttributeNode(attr.name);

    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    // @ts-ignore intentional readonly re-assignment
    candidate.ownerElement = this;

    if (existing) {
      const index = indexOf(this.attributes, existing);
      return splice(this.attributes, index, 1, candidate)[0];
    }

    push(this.attributes, candidate);
    return null;
  }

  setAttributeNodeNS(attr: Attr): Attr | null {
    const existing = this.getAttributeNodeNS(attr.namespaceURI, attr.localName);
    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    // @ts-ignore intentional readonly re-assignment
    candidate.ownerElement = this;

    if (existing) {
      const index = indexOf(this.attributes, existing);
      return splice(this.attributes, index, 1, candidate)[0];
    }

    push(this.attributes, candidate);
    return null;
  }

  removeAttributeNode(attr: Attr): Attr | null {
    const index = indexOf(this.attributes, attr);
    if (!attr || index < 0) throw new TypeError("Attribute not found");
    splice(this.attributes, indexOf(this.attributes, attr), 1);
    // @ts-ignore intentional readonly re-assignment
    attr.ownerElement = null!;
    return attr;
  }

  protected cloneShallow(): Element {
    const clonedAttrs = [...this.attributes].map((attr) => {
      const clone = attr.cloneNode();
      return clone;
    });
    return new Element(this.tagName, clonedAttrs);
  }

  override cloneNode(deep?: boolean): Element {
    const clone = this.cloneShallow();
    if (deep) {
      for (const child of this.children) {
        const childClone = child.cloneNode(true);
        clone.appendChild(childClone);
      }
    }
    return clone;
  }
}

/**
 * Represents a DOM CharacterData node as defined by the DOM Standard.
 *
 * This is an abstract subclass of the {@linkcode Node} interface. It adds
 * character data-specific properties and methods found in the DOM
 * specification, which focus on implementing the behavior of nodes that
 * contain character data, such as text nodes, comment nodes, and CDATA
 * sections.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode Text} for text node-specific properties and methods.
 * @category Types
 * @tags DOM, CharacterData
 */
export abstract class CharacterData extends Node {
  constructor(nodeName: string, data: string) {
    super(nodeName, data);
  }

  get data(): string {
    return this.nodeValue ?? "";
  }

  set data(value: string) {
    this.nodeValue = value;
  }

  get length(): number {
    return this.data.length;
  }

  substringData(offset: number, count: number): string {
    return this.data.substring(offset, offset + count);
  }

  appendData(data: string): void {
    this.data += data;
  }

  insertData(offset: number, data: string): void {
    const current = this.data;
    this.data = current.slice(0, offset) + data + current.slice(offset);
  }

  deleteData(offset: number, count: number): void {
    const current = this.data;
    this.data = current.slice(0, offset) + current.slice(offset + count);
  }

  replaceData(offset: number, count: number, data: string): void {
    const current = this.data;
    this.data = current.slice(0, offset) + data + current.slice(offset + count);
  }

  splitText(offset: number): Text {
    const current = this.data;
    const head = current.slice(0, offset);
    const tail = current.slice(offset);
    this.data = head;
    const newText = new Text(tail);
    if (this.parentNode) {
      this.parentNode.insertBefore(newText, this.nextSibling);
    }
    return newText;
  }

  get wholeText(): string {
    // deno-lint-ignore no-this-alias
    let start: Node | null = this;
    while (
      start?.previousSibling && start.previousSibling.nodeType === NodeType.Text
    ) {
      start = start.previousSibling;
    }
    let text = "";
    let cursor: Node | null = start;
    while (cursor && cursor.nodeType === NodeType.Text) {
      text += cursor.nodeValue ?? "";
      cursor = cursor.nextSibling;
    }
    return text;
  }

  protected cloneShallow(): CharacterData {
    // deno-lint-ignore no-explicit-any
    return new (CharacterData as any)(this.nodeName, this.data);
  }

  override cloneNode(): CharacterData {
    return this.cloneShallow();
  }
}

/**
 * Represents a DOM Text node as defined by the DOM Standard.
 *
 * This is a subclass of the {@linkcode CharacterData} interface. It adds text
 * node-specific properties and methods found in the DOM specification, which
 * focus on implementing the behavior of text nodes within the document tree.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode CharacterData} for character data-specific properties and
 * methods.
 * @category Types
 * @tags DOM, Text
 */
export class Text extends CharacterData {
  constructor(data: string) {
    super("#text", data);
  }

  get nodeType(): NodeType.Text {
    return NodeType.Text;
  }

  protected override cloneShallow(): Text {
    return new Text(this.data);
  }

  override cloneNode(): Text {
    return this.cloneShallow();
  }
}

/**
 * Represents a DOM CDATASection node as defined by the DOM Standard.
 * @category Types
 * @tags DOM, CDATASection
 */
export class CDATASection extends CharacterData {
  constructor(data: string) {
    super("#cdata-section", data);
  }

  get nodeType(): NodeType.CData {
    return NodeType.CData;
  }

  protected override cloneShallow(): CDATASection {
    return new CDATASection(this.data);
  }

  override cloneNode(): CDATASection {
    return this.cloneShallow();
  }
}

/**
 * Represents a DOM ProcessingInstruction node as defined by the DOM Standard.
 * @category Types
 * @tags DOM, ProcessingInstruction
 */
export class ProcessingInstruction extends Node {
  constructor(target: string, data: string) {
    super(target, data);
  }

  get nodeType(): NodeType.ProcessingInstruction {
    return NodeType.ProcessingInstruction;
  }

  get target(): string {
    return this.nodeName;
  }

  get data(): string {
    return this.nodeValue ?? "";
  }

  set data(value: string) {
    this.nodeValue = value;
  }

  protected cloneShallow(): ProcessingInstruction {
    return new ProcessingInstruction(this.target, this.data);
  }

  override cloneNode(): ProcessingInstruction {
    return this.cloneShallow();
  }
}

/**
 * Represents a DOM Comment node as defined by the DOM Standard.
 * @category Types
 * @tags DOM, Comment
 */
export class Comment extends CharacterData {
  constructor(data: string) {
    super("#comment", data);
  }

  get nodeType(): NodeType.Comment {
    return NodeType.Comment;
  }

  protected override cloneShallow(): Comment {
    return new Comment(this.data);
  }

  override cloneNode(): Comment {
    return this.cloneShallow();
  }
}

/**
 * Represents a DOM DocumentFragment as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document fragment-specific properties and methods found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, DocumentFragment
 */
export class DocumentFragment extends Node {
  constructor() {
    super("#document-fragment", null);
  }

  override readonly parentNode: null = null;

  get nodeType(): NodeType.DocumentFragment {
    return NodeType.DocumentFragment;
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

  getElementsByName<T extends Element>(name: string): NodeListOf<T> {
    const get = () => {
      const elements: T[] = [];

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (element.getAttribute("name") === name) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  getElementsByTagName<T extends Element>(tagName: string): NodeListOf<T> {
    const get = () => {
      const elements: T[] = [];
      const lowerTagName = tagName.toLowerCase();

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (
              tagName === "*" ||
              element.tagName.toLowerCase() === lowerTagName
            ) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  getElementsByTagNameNS<T extends Element>(
    namespace: string | null,
    localName: string,
  ): NodeListOf<T> {
    const get = () => {
      const elements: T[] = [];
      const lowerLocalName = localName.toLowerCase();

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            const elementNamespace = element.namespaceURI ?? null;
            if (
              (localName === "*" ||
                element.localName.toLowerCase() === lowerLocalName) &&
              (namespace === "*" || elementNamespace === namespace)
            ) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  getElementsByClassName<T extends Element>(className: string): NodeListOf<T> {
    const get = () => {
      const elements: T[] = [];

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (element.classList.contains(className)) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  protected cloneShallow(): DocumentFragment {
    return new DocumentFragment();
  }
}

/**
 * Represents a DOM DocumentType as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document type-specific properties found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, DocumentType
 */
export class DocumentType extends Node {
  readonly publicId: string;
  readonly systemId: string;
  readonly internalSubset: string | null = null;

  constructor(
    name: string,
    publicId: string,
    systemId: string,
    internalSubset: string | null = null,
  ) {
    super(name, null);
    this.publicId = publicId;
    this.systemId = systemId;
    this.internalSubset = internalSubset;
  }

  get nodeType(): NodeType.DocumentType {
    return NodeType.DocumentType;
  }

  get name(): string {
    return this.nodeName;
  }

  protected cloneShallow(): DocumentType {
    return new DocumentType(
      this.name,
      this.publicId,
      this.systemId,
      this.internalSubset,
    );
  }

  override cloneNode(): DocumentType {
    return this.cloneShallow();
  }
}

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

export type VisibilityState = "hidden" | "visible" | "prerender" | "unloaded";

/**
 * Represents a DOM Document as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document-specific properties and methods found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, Document
 */
export class Document extends Node {
  /**
   * Parse an HTML string into a new `Document` instance.
   */
  static parseHTML(html: string, options?: ParseOptions): Document {
    return parseHTML(html, options);
  }

  /**
   * Non-standard extension for XML parsing.
   */
  static parseXML(xml: string, options?: ParseOptions): Document {
    return parseXML(xml, options);
  }

  /**
   * Non-standard extension to parse an HTML fragment into a `DocumentFragment`.
   */
  static parseFragment(
    html: string,
    contextElement: string,
    options?: ParseOptions,
  ): DocumentFragment;
  /**
   * Non-standard extension to parse an HTML fragment into a `DocumentFragment`.
   */
  static parseFragment(
    html: string,
    options: FragmentParseOptions,
  ): DocumentFragment;
  static parseFragment(
    html: string,
    arg2?: string | FragmentParseOptions,
    arg3?: ParseOptions,
  ): DocumentFragment {
    if (typeof arg2 === "string") {
      return parseFragment(html, arg2, arg3);
    } else {
      return parseFragment(html, arg2?.contextElement ?? "div", arg2);
    }
  }

  #doctype: DocumentType | null = null;
  #documentElement: Element | null = null;
  #titleElement: Element | null = null;
  #body: Element | null = null;
  #head: Element | null = null;
  #baseURI: string | null = null;
  #quirksMode: QuirksModeType;
  #contentType: string;
  #visibilityState: VisibilityState = "visible";
  #url: string | null = null;

  cookie: string = "";
  override readonly ownerDocument: Document = this;
  override readonly parentNode: null = null;
  override readonly previousSibling: null = null;
  override readonly nextSibling: null = null;

  constructor(
    contentType: string,
    quirksMode: QuirksModeType,
    namespaceURI: string | null = XHTML_NAMESPACE,
    baseURI: string | null = null,
  ) {
    super("#document", null, null, null, null);
    this.#quirksMode = quirksMode;
    this.#contentType = contentType;
    this.#baseURI = baseURI;

    this.namespaceURI = namespaceURI;

    const readonly = <T>(
      value: T,
      enumerable = true,
      configurable = false,
    ) => ({ value, writable: false, enumerable, configurable });

    ObjectDefineProperties(this, {
      nodeType: readonly(NodeType.Document),
      ownerDocument: readonly(this),
      parentNode: readonly(null),
      previousSibling: readonly(null),
      nextSibling: readonly(null),
    });
  }

  get nodeType(): NodeType.Document {
    return NodeType.Document;
  }

  override get parentElement(): Element | null {
    return null;
  }

  override get baseURI(): string {
    return this.#baseURI ?? "about:blank";
  }

  get URL(): string {
    return this.#url ??= this.baseURI;
  }

  get documentURI(): string {
    return this.URL;
  }

  get location(): null {
    return null; // returns null in non-browser environments per spec
  }

  set location(value: unknown) {
    void value; // no-op
  }

  get defaultCharset(): string {
    return "UTF-8";
  }

  get charset(): string {
    return this.defaultCharset;
  }

  get characterSet(): string {
    return this.defaultCharset;
  }

  get contentType(): string {
    return this.#contentType;
  }

  get quirksMode(): QuirksModeType {
    return this.#quirksMode;
  }

  get visibilityState(): VisibilityState {
    return this.#visibilityState;
  }

  get hidden(): boolean {
    return this.#visibilityState === "hidden";
  }

  get compatMode(): "CSS1Compat" | "BackCompat" {
    return this.#quirksMode === "no-quirks" ? "CSS1Compat" : "BackCompat";
  }

  get defaultView(): null {
    return null; // returns null in non-browser environments per spec
  }

  get documentElement(): Element | null {
    return this.#documentElement ??= (() => {
      let child = this.firstChild;
      while (child) {
        if (child.nodeType === NodeType.Element) {
          return child as Element;
        }
        child = child.nextSibling;
      }
      return null;
    })();
  }

  get doctype(): DocumentType | null {
    return this.#doctype ??= (() => {
      let child = this.firstChild;
      while (child) {
        if (child.nodeType === NodeType.DocumentType) {
          return child as DocumentType;
        }
        child = child.nextSibling;
      }
      return null;
    })();
  }

  // TODO(nberlette): should this be a readonly property per spec?
  set doctype(value: DocumentType | null) {
    const existingDoctype = this.doctype;
    if (existingDoctype) {
      this.replaceChild(value!, existingDoctype);
    } else if (value) {
      this.insertBefore(value, this.documentElement);
    }
    this.#doctype = value;
  }

  get head(): Element | null {
    return this.#head ??= (() => {
      const docEl = this.documentElement;
      let child = docEl?.firstChild;
      while (child) {
        if (
          child.nodeType === NodeType.Element &&
          (child as Element).tagName.toLowerCase() === "head"
        ) {
          return child as Element;
        }
        child = child.nextSibling;
      }
      return null;
    })();
  }

  set head(value: Element | null) {
    const docEl = this.documentElement;
    if (!docEl) return;
    const existingHead = this.head;
    if (existingHead) {
      docEl.replaceChild(value!, existingHead);
    } else if (value) {
      docEl.insertBefore(value, docEl.firstChild);
    }
    this.#head = value;
  }

  get body(): Element | null {
    return this.#body ??= (() => {
      const docEl = this.documentElement;
      let child = docEl?.firstChild;
      while (child) {
        if (
          child.nodeType === NodeType.Element &&
          (child as Element).tagName.toLowerCase() === "body"
        ) {
          return child as Element;
        }
        child = child.nextSibling;
      }
      return null;
    })();
  }

  set body(value: Element | null) {
    const docEl = this.documentElement;
    if (!docEl) return;
    const existingBody = this.body;
    if (existingBody) {
      docEl.replaceChild(value!, existingBody);
    } else if (value) {
      docEl.appendChild(value);
    }
    this.#body = value;
  }

  get title(): string {
    if (!this.#titleElement) {
      const head = this.head;
      if (!head) return "";
      this.#titleElement = head.querySelector("title");
    }
    return this.#titleElement?.textContent ?? "";
  }

  set title(value: string) {
    let titleElement = this.#titleElement;
    const head = this.head;
    if (!head) return;
    if (!titleElement) {
      titleElement = this.#titleElement = this.createElement("title");
      head.appendChild(titleElement);
    }
    titleElement.textContent = value;
  }

  protected cloneShallow(): Document {
    return new Document(this.contentType, this.quirksMode);
  }

  createElement(tagName: string): Element {
    const element = new Element(tagName);
    element.ownerDocument = this;
    return element;
  }

  createElementNS(namespaceURI: string, qualifiedName: string): Element {
    const element = new Element(qualifiedName);
    element.ownerDocument = this;
    element.namespaceURI = namespaceURI;
    return element;
  }

  createAttribute(name: string, value?: string | null): Attr {
    const attr = new Attr(name, value ?? "", this.namespaceURI);
    attr.ownerDocument = this;
    return attr;
  }

  createAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value?: string | null,
  ): Attr {
    const attr = new Attr(qualifiedName, value ?? "", namespace);
    attr.ownerDocument = this;
    return attr;
  }

  createTextNode(data: string): Text {
    const node = new Text(data);
    node.ownerDocument = this;
    return node;
  }

  createComment(data: string): Comment {
    const node = new Comment(data);
    node.ownerDocument = this;
    return node;
  }

  createCDATASection(data: string): CDATASection {
    const node = new CDATASection(data);
    node.ownerDocument = this;
    return node;
  }

  createProcessingInstruction(
    target: string,
    data: string,
  ): ProcessingInstruction {
    const node = new ProcessingInstruction(target, data);
    node.ownerDocument = this;
    return node;
  }

  createDocumentFragment(): DocumentFragment {
    const fragment = new DocumentFragment();
    fragment.ownerDocument = this;
    return fragment;
  }

  createDocumentType(
    name: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    const doctype = new DocumentType(name, publicId, systemId);
    doctype.ownerDocument = this;
    return doctype;
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

  getElementsByName<T extends Element>(name: string): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (element.getAttribute("name") === name) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };
    return createHTMLCollection(this, get, "getElementsByName");
  }

  getElementsByTagName<T extends Element>(
    tagName: string,
  ): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];
      const lowerTagName = tagName.toLowerCase();

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (
              tagName === "*" ||
              element.tagName.toLowerCase() === lowerTagName
            ) {
              elements.push(element);
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
      const lowerLocalName = localName.toLowerCase();

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            const elementNamespace = element.namespaceURI ?? null;
            if (
              (localName === "*" ||
                element.localName.toLowerCase() === lowerLocalName) &&
              (namespace === "*" || elementNamespace === namespace)
            ) {
              elements.push(element);
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
            if (element.classList.contains(className)) {
              elements.push(element);
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

  override cloneNode(deep?: boolean): Document {
    const clone = this.cloneShallow();
    if (deep) {
      for (const child of this.childNodes) {
        const childClone = child.cloneNode(true);
        clone.appendChild(childClone);
      }
      clone.#doctype = this.doctype?.cloneNode() ?? null;
      clone.#documentElement = this.documentElement?.cloneNode(true) ?? null;
      clone.#head = this.head?.cloneNode(true) ?? null;
      clone.#body = this.body?.cloneNode(true) ?? null;
      clone.#titleElement = this.#titleElement?.cloneNode(true) ?? null;
    }
    return clone;
  }
}

export class GenericNode extends Node {
  #nodeType: NodeType;

  constructor(
    nodeType: NodeType,
    nodeName: string,
    nodeValue: string | null,
  ) {
    super(nodeName, nodeValue);
    this.#nodeType = nodeType;
  }

  get nodeType(): NodeType {
    return this.#nodeType;
  }

  protected cloneShallow(): GenericNode {
    return new GenericNode(this.nodeType, this.nodeName, this.nodeValue);
  }

  override cloneNode(deep = false): GenericNode {
    const clone = this.cloneShallow();
    if (deep) {
      for (const child of this.childNodes) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }
}
