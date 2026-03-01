import {
  _,
  ObjectDefineProperties,
  StringPrototypeToLowerCase,
  StringPrototypeToUpperCase,
} from "../_internal.ts";
import { readonly, XHTML_NAMESPACE, XML_NAME_PATTERN } from "./_common.ts";

import {
  createNamedNodeMap,
  type NamedNodeMap,
} from "../collections/NamedNodeMap.ts";
import { DOMStringMap } from "../collections/DOMStringMap.ts";
import { DOMTokenList } from "../collections/DOMTokenList.ts";

import type { CSSStyleDeclaration } from "../css/CSSStyleDeclaration.ts";
import "../css/CSSStyleDeclaration.ts";

import type { CSSStyleProperties } from "../css/CSSStyleProperties.ts";
import "../css/CSSStyleProperties.ts";
import { StylePropertyMap } from "../css/StylePropertyMap.ts";
import { ComputedStylePropertyMap } from "../css/styles/ComputedStylePropertyMap.ts";

import { parseFragment } from "../parse.ts";
import { serializeHTML } from "../serialize.ts";

import { NodeType } from "./types.ts";
import { Attr } from "./Attr.ts";
import { Node } from "./Node.ts";
import { ParentNode } from "./ParentNode.ts";

/**
 * Represents an Element as defined by the DOM Standard.
 *
 * @remarks
 * This is the generic ancestor (superclass) of all other element types, which
 * includes `HTMLElement`, `SVGElement`, `MathMLElement`, and all of their own
 * derivative subclasses (e.g., `HTMLTemplateElement`).
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds a
 * subset of the element-specific properties and methods found in the DOM
 * specification, which focus on implementing the behavior of element nodes,
 * their attributes, and their relationships to the rest of the document tree.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category DOM
 * @tags Element
 */
export class Element extends ParentNode {
  readonly tagName: string;
  readonly attributes: NamedNodeMap;

  #dataset: DOMStringMap | undefined;
  #classList: DOMTokenList | undefined;
  #style: CSSStyleProperties | undefined;
  #attributeStyleMap: StylePropertyMap | undefined;
  #computedStyleMap: ComputedStylePropertyMap | undefined;

  constructor(
    tagName: string,
    attrs: Attr[] = [],
    parentNode?: Node | null,
    firstChild?: Node | null,
    nextSibling?: Node | null,
  ) {
    tagName = StringPrototypeToUpperCase(tagName);
    super(tagName, null, parentNode, firstChild, nextSibling);
    this.tagName = tagName.toLocaleUpperCase();
    this.attributes = createNamedNodeMap(this, attrs);
    for (const attr of attrs) attr.ownerElement = this;
  }

  override get id(): string {
    return this.getAttribute("id") ?? "";
  }

  override set id(id: string | null | undefined) {
    if (id) {
      this.setAttribute("id", id);
    } else {
      this.removeAttribute("id");
    }
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

  get className(): string {
    return this.getAttribute("class") ?? "";
  }

  set className(value: string) {
    this.setAttribute("class", value);
  }

  get classList(): DOMTokenList {
    return this.#classList ??= new DOMTokenList(this, "class");
  }

  get dataset(): DOMStringMap {
    return this.#dataset ??= new DOMStringMap(this);
  }

  get innerHTML(): string {
    let html = "";
    for (let n = this.firstChild; n; n = n.nextSibling) {
      html += serializeHTML(n);
    }
    return html;
  }

  set innerHTML(value: string) {
    let tagName = "DIV";
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

  get style(): CSSStyleProperties {
    return this.#style ??= _.CSSStyleProperties.new(
      this,
      this.getAttribute("style") ?? "",
    );
  }

  set style(value: string | CSSStyleDeclaration | null | undefined) {
    if (value) {
      const cssText = typeof value === "string" ? value : value?.cssText ?? "";
      this.#style = _.CSSStyleDeclaration.new(this, cssText);
      this.#attributeStyleMap = new StylePropertyMap(this.#style);
      this.#computedStyleMap = new ComputedStylePropertyMap(this.#style);
    } else {
      this.#style = undefined;
      this.#attributeStyleMap = undefined;
      this.#computedStyleMap = undefined;
    }
  }

  get attributeStyleMap(): StylePropertyMap {
    return this.#attributeStyleMap ??= new StylePropertyMap(this.style);
  }

  get computedStyleMap(): ComputedStylePropertyMap {
    return this.#computedStyleMap ??= new ComputedStylePropertyMap(
      this.style,
    );
  }

  matches(selectors: string): boolean {
    return this[_.symbols.kSizzle].matches(selectors, this);
  }

  closest(selectors: string): Element | null {
    let prev = this.previousElementSibling;
    while (prev) {
      if (prev.matches(selectors)) return prev;
      prev = prev.previousElementSibling;
    }

    let next = this.nextElementSibling;
    while (next) {
      if (next.matches(selectors)) return next;
      next = next.nextElementSibling;
    }

    return null;
  }

  getAttribute(name: string): string | null {
    return this.getAttributeNode(name)?.value ?? null;
  }

  getAttributeNS(namespace: string | null, localName: string): string | null {
    return this.getAttributeNodeNS(namespace, localName)?.value ?? null;
  }

  getAttributeNames(): string[] {
    const names: string[] = [];
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      names.push(attr.name);
    }
    return names;
  }

  getAttributeNode(name: string): Attr | null {
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (attr.name === name) return attr;
    }
    return null;
  }

  getAttributeNodeNS(
    namespace: string | null,
    localName: string,
  ): Attr | null {
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (
        (attr.namespaceURI ?? null) === (namespace ?? null) &&
        attr.localName === localName
      ) {
        return attr;
      }
    }
    return null;
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

  removeAttribute(name: string): void {
    const attr = this.getAttributeNode(name);
    if (!attr) throw new Error("Attribute not found");
    this.removeAttributeNode(attr);
  }

  removeAttributeNS(namespace: string | null, localName: string): void {
    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i];
      if (attr.namespaceURI === namespace && attr.localName === localName) {
        this.removeAttributeNode(attr);
      }
    }
  }

  removeAttributeNode(attr: Attr): Attr | null {
    let node: Attr | null = null;
    for (let i = 0; i < this.attributes.length; i++) {
      if (this.attributes[i].isSameNode(attr)) {
        node = attr;
        break;
      }
    }
    if (!node) throw new TypeError("Attribute not found");
    this.attributes.removeNamedItem(attr.name);
    // @ts-ignore intentional readonly re-assignment
    attr.ownerElement = null!;
    return attr;
  }

  setAttribute(name: string, value: string): void {
    const attr = new Attr(name, value, this.namespaceURI, this);
    this.setAttributeNode(attr);
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string,
  ): void {
    const attr = new Attr(qualifiedName, value, namespace ?? null, this);
    attr.namespaceURI = namespace ?? null;
    this.setAttributeNode(attr);
  }

  setAttributeNode(attr: Attr): Attr | null {
    const existing = this.getAttributeNode(attr.name);

    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    // @ts-ignore intentional readonly re-assignment
    candidate.ownerElement = this;

    this.attributes.setNamedItem(candidate);
    return existing ?? null;
  }

  setAttributeNodeNS(attr: Attr): Attr | null {
    const existing = this.getAttributeNodeNS(attr.namespaceURI, attr.localName);
    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    // @ts-ignore intentional readonly re-assignment
    candidate.ownerElement = this;
    this.attributes.setNamedItemNS(candidate);
    return existing ?? null;
  }

  toggleAttribute(qualifiedName: string, force?: boolean): boolean {
    if (!XML_NAME_PATTERN.test(qualifiedName)) {
      throw new DOMException(
        "The qualified name provided is not a valid name.",
        "InvalidCharacterError",
      );
    }

    const isHtmlElement = this.namespaceURI === XHTML_NAMESPACE &&
      this.ownerDocument?.contentType === "text/html";
    const name = isHtmlElement
      ? StringPrototypeToLowerCase(qualifiedName)
      : qualifiedName;
    const attr = isHtmlElement
      ? this.attributes.getNamedItem(name)
      : this.getAttributeNode(name);

    const hasForce = force !== undefined;
    const forceValue = hasForce ? !!force : undefined;

    if (!attr) {
      if (forceValue === false) return false;
      this.setAttribute(name, "");
      return true;
    }

    if (forceValue === true) return true;

    this.removeAttributeNode(attr);
    return false;
  }

  protected [_.keys.clone_shallow](): Element {
    const clonedAttrs = [...this.attributes].map((attr) => {
      const clone = attr.cloneNode();
      return clone;
    });
    return new Element(this.tagName, clonedAttrs);
  }

  override cloneNode(deep?: boolean): Element {
    const clone = this[_.keys.clone_shallow]();
    if (deep) {
      for (const child of this.children) {
        const childClone = child.cloneNode(true);
        clone.appendChild(childClone);
      }
    }
    return clone;
  }

  declare readonly [Symbol.toStringTag]: string;

  static {
    ObjectDefineProperties(this.prototype, {
      [Symbol.toStringTag]: readonly("Element", false, true),
    });
  }
}
