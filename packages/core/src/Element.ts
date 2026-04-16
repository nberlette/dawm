import {
  _,
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptors,
  StringPrototypeToLowerCase,
  StringPrototypeToUpperCase,
} from "dawm-internal";
import {
  ArrayPrototypePush,
  isIterable,
  isPlainObject,
  ObjectHasOwn,
  String,
  SymbolToStringTag,
  XHTML_NAMESPACE,
  XML_NAME_PATTERN,
} from "dawm-internal";

import {
  createNamedNodeMap,
  NamedNodeMap,
} from "./collections/NamedNodeMap.ts";
import { DOMStringMap } from "./collections/DOMStringMap.ts";
import { DOMTokenList } from "./collections/DOMTokenList.ts";
import { ARIAMixin } from "dawm-html/aria-mixin";
import { CSSStyleDeclaration } from "dawm-css/css-style-declaration";
import { CSSStyleProperties } from "dawm-css/css-style-properties";
import { getComputedStyleDeclarationForElement } from "dawm-css/cascade";
import { StylePropertyMap } from "dawm-css/style-property-map";
import {
  ComputedStylePropertyMap,
} from "dawm-css/styles/computed-style-property-map";
import { hydrateDocumentCSS } from "dawm-css/hydrate";
import { parse_frag } from "./parser.ts";
import { buildDocumentTreeFast } from "dawm-tree/tree";
import { toWireDoc } from "dawm-tree/wire";
import { resolveFragmentOptions } from "./options.ts";
import { serializeHTML } from "./serialize.ts";
import { NodeType } from "./types.ts";
import { Attr } from "./Attr.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { Node } from "./Node.ts";
import { ParentNode } from "./ParentNode.ts";
import { DOMException } from "./DOMException.ts";

declare module "dawm-internal" {
  export interface ElementInternal {
    new: (
      tagName: string,
      attrs?: Attr[],
      parentNode?: Node | null,
      firstChild?: Node | null,
      nextSibling?: Node | null,
    ) => Element;

    getTagName<T extends Element>(instance: T): string;
    setTagName<T extends Element>(instance: T, tagName: string): T;
    getAttributes<T extends Element>(instance: T): NamedNodeMap;
    setAttributes<T extends Element>(instance: T, attrs: NamedNodeMap): T;
    getClassList<T extends Element>(instance: T): DOMTokenList;
    setClassList<T extends Element>(instance: T, classList: DOMTokenList): T;
    getDataset<T extends Element>(instance: T): DOMStringMap;
    setDataset<T extends Element>(instance: T, dataset: DOMStringMap): T;
    getStyle<T extends Element>(instance: T): CSSStyleProperties;
    setStyle<T extends Element>(instance: T, style: CSSStyleProperties): T;
    getAttributeStyleMap<T extends Element>(instance: T): StylePropertyMap;
    setAttributeStyleMap<T extends Element>(
      instance: T,
      attributeStyleMap: StylePropertyMap,
    ): T;
    getComputedStyleMap<T extends Element>(
      instance: T,
    ): ComputedStylePropertyMap;
    setComputedStyleMap<T extends Element>(
      instance: T,
      computedStyleMap: ComputedStylePropertyMap,
    ): T;

    matches<T extends Element>(instance: T, selectors: string): boolean;
    closest<T extends Element>(instance: T, selectors: string): Element | null;

    getAttribute<T extends Element>(instance: T, name: string): string | null;
    getAttributeNS<T extends Element>(
      instance: T,
      namespace: string | null,
      localName: string,
    ): string | null;
    getAttributeNames<T extends Element>(instance: T): string[];
    getAttributeNode<T extends Element>(
      instance: T,
      name: string,
    ): Attr | null;
    getAttributeNodeNS<T extends Element>(
      instance: T,
      namespace: string | null,
      localName: string,
    ): Attr | null;
    hasAttribute<T extends Element>(instance: T, name: string): boolean;
    hasAttributes<T extends Element>(instance: T): boolean;
    hasAttributeNS<T extends Element>(
      instance: T,
      namespace: string | null,
      localName: string,
    ): boolean;
    removeAttribute<T extends Element>(instance: T, name: string): void;
    removeAttributeNS<T extends Element>(
      instance: T,
      namespace: string | null,
      localName: string,
    ): void;
    removeAttributeNode<T extends Element>(
      instance: T,
      attr: Attr,
    ): Attr | null;
    setAttribute<T extends Element>(
      instance: T,
      name: string,
      value: string,
    ): void;
    setAttributeNS<T extends Element>(
      instance: T,
      namespace: string | null,
      qualifiedName: string,
      value: string,
    ): void;
    setAttributeNode<T extends Element>(
      instance: T,
      attr: Attr,
    ): Attr | null;
    setAttributeNodeNS<T extends Element>(
      instance: T,
      attr: Attr,
    ): Attr | null;
    toggleAttribute<T extends Element>(
      instance: T,
      qualifiedName: string,
      force?: boolean,
    ): boolean;

    parseFragment<T extends Element>(
      instance: T,
      value: string,
    ): DocumentFragment;
  }

  export interface internal {
    Element: ElementInternal;
  }
}

function parseElementFragment(
  value: string,
  contextElement: string,
): DocumentFragment {
  const resolved = resolveFragmentOptions({ contextElement });
  const wire = parse_frag(value, resolved);
  const doc = hydrateDocumentCSS(buildDocumentTreeFast(toWireDoc(wire)));

  const fragment = new DocumentFragment();
  _.Node.setOwnerDocument(fragment, doc);

  const container = doc.documentElement ?? doc.firstElementChild;
  while (container?.firstChild) {
    fragment.appendChild(container.removeChild(container.firstChild));
  }

  return fragment;
}

function normalizeAttributes(
  ownerElement: Element,
  attrs:
    | NamedNodeMap
    | Iterable<Attr>
    | Record<string, string | null | undefined>
    | null
    | undefined,
): NamedNodeMap {
  if (attrs instanceof NamedNodeMap) {
    _.NamedNodeMap.setOwnerElement(attrs, ownerElement);
    for (const attr of attrs) {
      _.Attr.setOwnerElement(attr, ownerElement);
      _.Attr.setNamedNodeMap(attr, attrs);
    }
    return attrs;
  }

  if (isIterable(attrs)) {
    return _.NamedNodeMap.new(ownerElement, attrs);
  }

  if (isPlainObject(attrs)) {
    const list: Attr[] = [];
    for (const key in attrs) {
      if (!ObjectHasOwn(attrs, key)) continue;
      const value = attrs[key];
      if (value != null) {
        ArrayPrototypePush(
          list,
          _.Attr.new(
            key,
            String(value),
            ownerElement.namespaceURI,
            ownerElement,
          ),
        );
      }
    }
    return _.NamedNodeMap.new(ownerElement, list);
  }

  if (attrs == null) {
    return _.NamedNodeMap.new(ownerElement);
  }

  throw new TypeError("Invalid attributes value");
}

export interface Element extends ARIAMixin {}

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
  #tagName = "";
  #attributes!: NamedNodeMap;
  #dataset: DOMStringMap | undefined;
  #classList: DOMTokenList | undefined;
  #style: CSSStyleProperties | undefined;
  #attributeStyleMap: StylePropertyMap | undefined;
  #computedStyleMap: ComputedStylePropertyMap | undefined;

  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
    _.Element.setTagName(this, "");
    _.Element.setAttributes(this, _.NamedNodeMap.new(this));
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

  get tagName(): string {
    return _.Element.getTagName(this);
  }

  get attributes(): NamedNodeMap {
    return _.Element.getAttributes(this);
  }

  set attributes(
    attrs:
      | NamedNodeMap
      | Iterable<Attr>
      | Record<string, string | null | undefined>
      | null
      | undefined,
  ) {
    _.Element.setAttributes(this, normalizeAttributes(this, attrs));
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
    const tagName = this.tagName;
    const fragment = parseElementFragment(value, tagName);
    while (this.firstChild) this.removeChild(this.firstChild);
    while (fragment.firstChild) {
      this.appendChild(fragment.removeChild(fragment.firstChild));
    }
  }

  get outerHTML(): string {
    return serializeHTML(this);
  }

  set outerHTML(value: string) {
    if (!this.parentNode) {
      throw new TypeError("Cannot set outerHTML on a disconnected element.");
    }
    const ast = parseElementFragment(
      value,
      this.parentElement?.tagName || "DIV",
    );
    const node = ast.firstChild;
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
      this.#style = _.CSSStyleProperties.new(this, cssText);
      this.#attributeStyleMap = new StylePropertyMap(this.#style);
      this.#computedStyleMap = new ComputedStylePropertyMap(this.#style);
      this.setAttribute("style", cssText);
    } else {
      this.#style = this.#attributeStyleMap = this.#computedStyleMap = void 0;
    }
  }

  get attributeStyleMap(): StylePropertyMap {
    return this.#attributeStyleMap ??= new StylePropertyMap(this.style);
  }

  get computedStyleMap(): ComputedStylePropertyMap {
    const computed = getComputedStyleDeclarationForElement(this);
    if (this.#computedStyleMap) {
      _.StylePropertyMapReadOnly.setStyle(this.#computedStyleMap, computed);
      return this.#computedStyleMap;
    }
    return this.#computedStyleMap = new ComputedStylePropertyMap(computed);
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
      ) return attr;
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
    _.Attr.setOwnerElement(attr, null);
    _.Attr.setNamedNodeMap(attr, null);
    return attr;
  }

  setAttribute(name: string, value: string): void {
    const attr = _.Attr.new(name, value, this.namespaceURI, this);
    this.setAttributeNode(attr);
  }

  setAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value: string,
  ): void {
    const attr = _.Attr.new(qualifiedName, value, namespace ?? null, this);
    _.Node.setNamespaceURI(attr, namespace ?? null);
    this.setAttributeNode(attr);
  }

  setAttributeNode(attr: Attr): Attr | null {
    const existing = this.getAttributeNode(attr.name);

    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    _.Attr.setOwnerElement(candidate, this);
    _.Attr.setNamedNodeMap(candidate, this.attributes);
    _.Node.setOwnerDocument(candidate, this.ownerDocument);

    this.attributes.setNamedItem(candidate);
    return existing ?? null;
  }

  setAttributeNodeNS(attr: Attr): Attr | null {
    const existing = this.getAttributeNodeNS(attr.namespaceURI, attr.localName);
    const candidate = attr.ownerElement && attr.ownerElement !== this
      ? attr.cloneNode()
      : attr;

    _.Attr.setOwnerElement(candidate, this);
    _.Attr.setNamedNodeMap(candidate, this.attributes);
    _.Node.setOwnerDocument(candidate, this.ownerDocument);
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
    const clone = _.Element.new(this.tagName, clonedAttrs);
    _.Node.setNamespaceURI(clone, this.namespaceURI);
    _.Node.setOwnerDocument(clone, this.ownerDocument);
    for (const attr of clone.attributes) {
      _.Node.setOwnerDocument(attr, clone.ownerDocument);
    }
    return clone;
  }

  override cloneNode(deep?: boolean): Element {
    const clone = this[_.keys.clone_shallow]();
    if (deep) {
      for (const child of this.childNodes) {
        const childClone = child.cloneNode(true);
        clone.appendChild(childClone);
      }
    }
    return clone;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    _.toStringTag("Element")(this);
    _.Element = {
      ...(_.Element ?? {}),
      new: (tagName, attrs, parentNode, firstChild, nextSibling) => {
        const element = _.Node.create(
          Element,
          tagName,
          null,
          parentNode,
          firstChild,
          nextSibling,
        );
        _.Element.setTagName(element, tagName);
        _.Element.setAttributes(
          element,
          normalizeAttributes(element, attrs ?? []),
        );
        return element;
      },
      getTagName: (instance) => instance.#tagName,
      setTagName: (instance, tagName) => (
        _.Node.setNodeName(instance, tagName),
          (instance.#tagName = tagName),
          instance
      ),
      getAttributes: (instance) => instance.#attributes,
      setAttributes: (instance, attrs) => {
        instance.#attributes = attrs;
        _.NamedNodeMap.setOwnerElement(attrs, instance);
        for (const attr of attrs) {
          _.Attr.setOwnerElement(attr, instance);
          _.Attr.setNamedNodeMap(attr, attrs);
          _.Node.setOwnerDocument(attr, instance.ownerDocument);
        }
        return instance;
      },
      getClassList: (instance) =>
        instance.#classList ??= new DOMTokenList(instance, "class"),
      setClassList: (
        instance,
        classList,
      ) => ((instance.#classList = classList), instance),
      getDataset: (instance) =>
        instance.#dataset ??= new DOMStringMap(instance),
      setDataset: (
        instance,
        dataset,
      ) => ((instance.#dataset = dataset), instance),
      getStyle: (instance) =>
        instance.#style ??= _.CSSStyleProperties.new(
          instance,
          instance.getAttribute("style") ?? "",
        ),
      setStyle: (instance, style) => ((instance.#style = style), instance),
      getAttributeStyleMap: (instance) =>
        instance.#attributeStyleMap ??= new StylePropertyMap(instance.style),
      setAttributeStyleMap: (instance, attributeStyleMap) => (
        (instance.#attributeStyleMap = attributeStyleMap), instance
      ),
      getComputedStyleMap: (instance) => instance.computedStyleMap,
      setComputedStyleMap: (instance, computedStyleMap) => (
        (instance.#computedStyleMap = computedStyleMap), instance
      ),
      matches: (instance, selectors) => instance.matches(selectors),
      closest: (instance, selectors) => instance.closest(selectors),
      getAttribute: (instance, name) => instance.getAttribute(name),
      getAttributeNS: (instance, namespace, localName) =>
        instance.getAttributeNS(namespace, localName),
      getAttributeNames: (instance) => instance.getAttributeNames(),
      getAttributeNode: (instance, name) => instance.getAttributeNode(name),
      getAttributeNodeNS: (instance, namespace, localName) =>
        instance.getAttributeNodeNS(namespace, localName),
      hasAttribute: (instance, name) => instance.hasAttribute(name),
      hasAttributes: (instance) => instance.hasAttributes(),
      hasAttributeNS: (instance, namespace, localName) =>
        instance.hasAttributeNS(namespace, localName),
      removeAttribute: (instance, name) => instance.removeAttribute(name),
      removeAttributeNS: (instance, namespace, localName) =>
        instance.removeAttributeNS(namespace, localName),
      removeAttributeNode: (instance, attr) =>
        instance.removeAttributeNode(attr),
      setAttribute: (instance, name, value) =>
        instance.setAttribute(name, value),
      setAttributeNS: (instance, namespace, qualifiedName, value) =>
        instance.setAttributeNS(namespace, qualifiedName, value),
      setAttributeNode: (instance, attr) => instance.setAttributeNode(attr),
      setAttributeNodeNS: (instance, attr) => instance.setAttributeNodeNS(attr),
      toggleAttribute: (instance, qualifiedName, force) =>
        instance.toggleAttribute(qualifiedName, force),
      parseFragment: (instance, value) =>
        parseElementFragment(value, instance.tagName),
    };
  }

  static {
    ObjectDefineProperties(
      this.prototype,
      ObjectGetOwnPropertyDescriptors(ARIAMixin.prototype),
    );
  }
}
