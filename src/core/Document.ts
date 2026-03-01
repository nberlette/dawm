import {
  _,
  ObjectDefineProperties,
  readonly,
  SymbolToStringTag,
  XHTML_NAMESPACE,
  XML_NAMESPACE,
} from "./_common.ts";

import {
  createHTMLCollection,
  type HTMLCollectionOf,
} from "../collections/HTMLCollection.ts";

import type { Node } from "./Node.ts";
import type { QuirksModeType } from "./types.ts";
import type { FragmentParseOptions, ParseOptions } from "../options.ts";

import { parseFragment, parseHTML, parseXML } from "../parse.ts";
import {
  type MediaQueryEnvironment,
  MediaQueryList,
} from "../css/MediaQueryList.ts";
import { NodeType } from "../wasm.ts";
import { Attr } from "./Attr.ts";
import { CDATASection } from "./CDATASection.ts";
import { Comment } from "./Comment.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { DocumentType } from "./DocumentType.ts";
import { Element } from "./Element.ts";
import { DOMImplementation } from "./DOMImplementation.ts";
import { NodeFilter } from "./NodeFilter.ts";
import { NodeIterator } from "./NodeIterator.ts";
import { ParentNode } from "./ParentNode.ts";
import { ProcessingInstruction } from "./ProcessingInstruction.ts";
import { Range } from "./Range.ts";
import { Text } from "./Text.ts";
import { TreeWalker } from "./TreeWalker.ts";
import { clone_shallow } from "../internal/keys.ts";

const acceptAllNodeFilter = { acceptNode: () => NodeFilter.FILTER_ACCEPT };

export type VisibilityState = "hidden" | "visible";

/**
 * Represents a Document as defined by the DOM Standard, which is the top-most
 * node in the structural "tree" of a given web page (also referred to as the
 * "root" node). All of the nodes which comprise the actual document structure
 * of the page are contained within the associated document (also known as the
 * "owner" document). Every descendant node within the document is associated
 * directly to the root document node via the {@linkcode Node.ownerDocument}
 * property, which is `null` on the document itself.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document-specific properties and methods found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, Document
 */
export class Document extends ParentNode {
  /**
   * Parse an HTML string into a new {@linkcode HTMLDocument} instance. This is
   * intended to align with the semi-standard [`Document.parseHTML`] method
   * found in some browser implementations (currently only Firefox), with added
   * support for the dawm WebAssembly-based parser's {@linkcode ParseOptions}
   * as a second argument.
   *
   * **Note**: This implementation does **not** support the sanitization
   * options found in the Firefox implementation, as dawm's parser is designed
   * to be secure by default (i.e., scripts are ignored and never executed, in
   * any parsing context). If you need to sanitize untrusted HTML input, consider
   * using a library like DOMPurify on the client side, or a server-side HTML
   * sanitizer if you're working in a Node.js environment.
   *
   * @param html The HTML string to parse into a Document.
   * @param [options] Optional parsing options to customize the behavior of the
   * dawm WebAssembly-based parser.
   * @returns an {@linkcode HTMLDocument} instance containing the parsed
   * document tree from the provided markup text.
   */
  static parseHTML(html: string, options?: ParseOptions): HTMLDocument {
    return parseHTML(html, options);
  }

  /**
   * Similar to the {@linkcode Document.parseHTML} method, but configured for
   * parsing XML documents instead of HTML. This is a non-standard extension
   * that is not present in the official specification.
   *
   * @param xml The XML markup to parse into an `XMLDocument` instance.
   * @param [options] Optional parsing options to customize the behavior of the
   * dawm WebAssembly-based parser.
   * @returns an {@linkcode XMLDocument} instance containing the parsed
   * document tree from the provided markup text.
   */
  static parseXML(xml: string, options?: ParseOptions): XMLDocument {
    return parseXML(xml, options);
  }

  /**
   * Similar to the {@linkcode Document.parseHTML} method, except the returned
   * object is a {@linkcode DocumentFragment} node instead of a full-fledged
   * `Document` instance.
   *
   * When parsing HTML fragments with this method, ffyou must specify a valid tag
   * name for the `contextElement` argument. The parser relies on the context
   * element name to accurately reconstruct the fragment subtree it is parsing,
   * as it is running in a headless state without an outer Document container.
   *
   * @param html The HTML fragment markup to parse into a `DocumentFragment`.
   * @param contextElement The HTML tag name of the virtual parent element of
   * the HTML fragment provided in the first argument. This is necessary for
   * the parser to understand how to reconstruct the fragment subtree without
   * an outer Document container as its context provider. For example, if the
   * markup string contains an `<input ... />` element, setting the context
   * element to `"form"` would parse the input field as if it were a direct
   * descendant of an `HTMLFormElement` node in a virtual DOM document tree.
   * @param [options] Optional configuration settings allowing the parser's
   * behavior to be fine-tuned to the specific needs of your use case.
   * @returns a {@linkcode DocumentFragment} instance containing the parsed
   * HTML fragment's subtree.
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
  #cookie = "";
  #quirksMode: QuirksModeType;
  #contentType: string;
  #visibilityState: VisibilityState = "visible";
  #url: string | null = null;
  #implementation: DOMImplementation | null = null;

  override readonly ownerDocument: null = null;
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

    ObjectDefineProperties(this, {
      nodeType: readonly(NodeType.Document),
      ownerDocument: readonly(null),
      parentNode: readonly(null),
      previousSibling: readonly(null),
      nextSibling: readonly(null),
    });
  }

  get nodeType(): NodeType.Document {
    return NodeType.Document;
  }

  override get parentElement(): null {
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

  /**
   * Non-standard extension for headless environments where `Window.matchMedia`
   * is not available.
   */
  matchMedia(mediaQueryString: string): MediaQueryList {
    return _.MediaQueryList.setDocument(
      new MediaQueryList(mediaQueryString),
      this,
    );
  }

  /**
   * Non-standard extension to update the document-scoped media query
   * evaluation environment.
   */
  setMediaEnvironment(state: Partial<MediaQueryEnvironment>): this {
    _.MediaQueryList.setDocumentState(this, state, true);
    return this;
  }

  get mediaEnvironment(): Readonly<MediaQueryEnvironment> {
    return _.MediaQueryList.getDocumentState(this);
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

  get cookie(): string {
    return this.#cookie;
  }

  set cookie(cookie: string | null | undefined) {
    this.#cookie = cookie || "";
  }

  get implementation(): DOMImplementation {
    return this.#implementation ??= new DOMImplementation();
  }

  protected [_.keys.clone_shallow](): Document {
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

  createRange(): Range {
    return new Range(this, 0);
  }

  createNodeIterator(
    root: Node,
    whatToShow: number = NodeFilter.SHOW_ALL,
    filter: NodeFilter | null = null,
    _entityReferenceExpansion = false,
  ): NodeIterator {
    return _.NodeIterator.new(
      root,
      root,
      filter ?? acceptAllNodeFilter,
      whatToShow,
      false,
    );
  }

  createTreeWalker(
    root: Node,
    whatToShow: number = NodeFilter.SHOW_ALL,
    filter: NodeFilter | null = null,
    entityReferenceExpansion = false,
  ): TreeWalker {
    return _.TreeWalker.new(
      root,
      root,
      filter ?? acceptAllNodeFilter,
      whatToShow,
      entityReferenceExpansion,
    );
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

  override cloneNode(deep?: boolean): Document {
    const clone = this[clone_shallow]();
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

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("Document", false, true),
    });
  }
}

export class HTMLDocument extends Document {
  constructor() {
    super("text/html", "no-quirks", XHTML_NAMESPACE);
  }

  declare readonly [SymbolToStringTag]: "HTMLDocument";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("HTMLDocument", false, true),
    });
  }
}

export class XMLDocument extends Document {
  constructor() {
    super("application/xml", "no-quirks", XML_NAMESPACE);
  }

  declare readonly [SymbolToStringTag]: "XMLDocument";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("XMLDocument", false, true),
    });
  }
}
