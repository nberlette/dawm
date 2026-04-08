import {
  _,
  ArrayPrototypePush,
  ObjectDefineProperties,
  readonly,
  SymbolToStringTag,
  toStringTag,
  XHTML_NAMESPACE,
  XML_NAMESPACE,
} from "dawm-internal";

import {
  createHTMLCollection,
  type HTMLCollectionOf,
} from "./collections/HTMLCollection.ts";

import type { Node } from "./Node.ts";
import type { QuirksModeType } from "./types.ts";

import {
  type MediaQueryEnvironment,
  MediaQueryList,
} from "dawm-css/media-query-list";
import { CSSStyleSheetList } from "dawm-css/css-style-sheet-list";
import { NodeType } from "./types.ts";
import { Attr } from "./Attr.ts";
import { CDATASection } from "./CDATASection.ts";
import { Comment } from "./Comment.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { DocumentType } from "./DocumentType.ts";
import { Element } from "./Element.ts";
import type { DOMImplementation } from "./DOMImplementation.ts";
import { acceptAllNodeFilter, NodeFilter } from "./NodeFilter.ts";
import { NodeIterator } from "./NodeIterator.ts";
import { ParentNode } from "./ParentNode.ts";
import { ProcessingInstruction } from "./ProcessingInstruction.ts";
import { Range } from "./Range.ts";
import { Text } from "./Text.ts";
import { TreeWalker } from "./TreeWalker.ts";
import { clone_shallow, set_media_env } from "dawm-internal/keys";
import type { strings } from "dawm-internal/types";

declare module "dawm-internal" {
  export interface DocumentInternal {
    create<T extends typeof Document>(
      ctor: T,
      contentType?: string,
      quirksMode?: QuirksModeType,
      namespaceURI?: string | null,
      baseURI?: string | null,
    ): InstanceType<T>;
    getContentType(document: Document): string;
    setContentType(document: Document, contentType: string): Document;
    getQuirksMode(document: Document): QuirksModeType;
    setQuirksMode(document: Document, quirksMode: QuirksModeType): Document;
    getBaseURI(document: Document): string | null;
    setBaseURI(document: Document, baseURI: string | null): Document;
    getURL(document: Document): string | null;
    setURL(document: Document, url: string | null): Document;
    getImplementation(document: Document): DOMImplementation | null;
    setImplementation(
      document: Document,
      implementation: DOMImplementation | null,
    ): Document;
    getStyleSheets(document: Document): CSSStyleSheetList;
    setStyleSheets(
      document: Document,
      styleSheets: CSSStyleSheetList | null | undefined,
    ): void;
  }

  export interface internal {
    Document: DocumentInternal;
  }
}

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
  #doctype: DocumentType | null = null;
  #documentElement: Element | null = null;
  #titleElement: Element | null = null;
  #body: Element | null = null;
  #head: Element | null = null;
  #baseURI: string | null = null;
  #cookie = "";
  #quirksMode!: QuirksModeType;
  #contentType!: string;
  #visibilityState: VisibilityState = "visible";
  #url: string | null = null;
  #implementation: DOMImplementation | null = null;
  #styleSheets: CSSStyleSheetList | null = null;

  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
    _.Node.setNodeName(this, "#document");
    _.Node.setNodeValue(this, null);
    _.Node.setNamespaceURI(this, XHTML_NAMESPACE);
  }

  get nodeType(): NodeType.Document {
    return NodeType.Document;
  }

  override get parentElement(): null {
    return null;
  }

  override get ownerDocument(): null {
    return null;
  }

  override get parentNode(): null {
    return null;
  }

  override get previousSibling(): null {
    return null;
  }

  override get nextSibling(): null {
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

  get styleSheets(): CSSStyleSheetList {
    return _.Document.getStyleSheets(this);
  }

  get defaultView(): null {
    return null; // returns null in non-browser environments per spec
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
    if (!_.DOMImplementation?.new) {
      throw new ReferenceError(
        "Internal constructor hook `_.DOMImplementation.new` is not initialized. Import `./DOMImplementation.ts` (or the package root) before accessing `Document.implementation`.",
      );
    }
    return this.#implementation ??= _.DOMImplementation.new();
  }

  protected [clone_shallow](): Document {
    const clone = _.Document.create(
      this.constructor as typeof Document,
      this.contentType,
      this.quirksMode,
      this.namespaceURI,
      this.#baseURI,
    );
    _.Document.setURL(clone, _.Document.getURL(this));
    return clone;
  }

  /**
   * Non-standard extension to update the document-scoped media query
   * evaluation environment.
   */
  [set_media_env](state: Partial<MediaQueryEnvironment>): this {
    _.MediaQueryList.setDocumentState(this, state, true);
    return this;
  }

  /**
   * Non-standard extension for headless environments where `Window.matchMedia`
   * is not available.
   */
  matchMedia(mediaQueryString: string): MediaQueryList {
    return _.MediaQueryList.setDocument(
      _.MediaQueryList.new(mediaQueryString),
      this,
    );
  }

  createElement(tagName: string): Element {
    const element = _.Element.new(tagName);
    _.Node.setOwnerDocument(element, this);
    return element;
  }

  createElementNS(namespaceURI: string, qualifiedName: string): Element {
    const element = _.Element.new(qualifiedName);
    _.Node.setOwnerDocument(element, this);
    _.Node.setNamespaceURI(element, namespaceURI);
    return element;
  }

  createAttribute(name: string, value?: string | null): Attr {
    return _.Attr.new(name, value ?? "", this.namespaceURI, null, this);
  }

  createAttributeNS(
    namespace: string | null,
    qualifiedName: string,
    value?: string | null,
  ): Attr {
    return _.Attr.new(qualifiedName, value ?? "", namespace, null, this);
  }

  createTextNode(data: string): Text {
    const node = new Text(data);
    _.Node.setOwnerDocument(node, this);
    return node;
  }

  createComment(data: string): Comment {
    const node = new Comment(data);
    _.Node.setOwnerDocument(node, this);
    return node;
  }

  createCDATASection(data: string): CDATASection {
    const node = _.CDATASection.new(data);
    _.Node.setOwnerDocument(node, this);
    return node;
  }

  createProcessingInstruction(
    target: string,
    data: string,
  ): ProcessingInstruction {
    const node = _.ProcessingInstruction.new(target, data);
    _.Node.setOwnerDocument(node, this);
    return node;
  }

  createDocumentFragment(): DocumentFragment {
    const fragment = _.DocumentFragment.new();
    _.Node.setOwnerDocument(fragment, this);
    return fragment;
  }

  createDocumentType(
    name: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    const doctype = _.DocumentType.new(name, publicId, systemId);
    _.Node.setOwnerDocument(doctype, this);
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
    return (NodeIterator as typeof NodeIterator & {
      create: (
        root: Node,
        referenceNode: Node,
        filter?: NodeFilter | null,
        whatToShow?: number,
        pointerBeforeReferenceNode?: boolean,
      ) => NodeIterator;
    }).create(
      root,
      root,
      filter ?? acceptAllNodeFilter,
      whatToShow,
      true,
    );
  }

  createTreeWalker(
    root: Node,
    whatToShow: number = NodeFilter.SHOW_ALL,
    filter: NodeFilter | null = null,
    entityReferenceExpansion = false,
  ): TreeWalker {
    return (TreeWalker as typeof TreeWalker & {
      create: (
        root: Node,
        currentNode: Node,
        filter?: NodeFilter | null,
        whatToShow?: number,
        entityReferenceExpansion?: boolean,
      ) => TreeWalker;
    }).create(
      root,
      root,
      filter ?? acceptAllNodeFilter,
      whatToShow,
      entityReferenceExpansion,
    );
  }

  createEvent(type: string, eventInitDict?: EventInit): Event {
    return new Event(type, eventInitDict);
  }

  getElementsByName<T extends Element>(name: string): HTMLCollectionOf<T> {
    const get = () => {
      const elements: T[] = [];

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (element.getAttribute("name") === name) {
              ArrayPrototypePush(elements, element);
            }
          }
          if (node.firstChild) traverse(node.firstChild);
          node = node.nextSibling;
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

  declare readonly [SymbolToStringTag]: "Document" | strings;

  static {
    _.Document = {
      ..._.Document,
      create: (
        ctor,
        contentType = "application/xml",
        quirksMode = "no-quirks",
        namespaceURI = XHTML_NAMESPACE,
        baseURI = null,
      ) => {
        const document = new (ctor as any)(_.keys._private);
        _.Document.setContentType(document, contentType);
        _.Document.setQuirksMode(document, quirksMode);
        _.Document.setBaseURI(document, baseURI);
        _.Node.setNamespaceURI(document, namespaceURI);
        return document;
      },
      getContentType: (document: Document) => document.#contentType,
      setContentType: (document: Document, contentType: string) => (
        (document.#contentType = contentType), document
      ),
      getQuirksMode: (document: Document) => document.#quirksMode,
      setQuirksMode: (document: Document, quirksMode: QuirksModeType) => (
        (document.#quirksMode = quirksMode), document
      ),
      getBaseURI: (document: Document) => document.#baseURI,
      setBaseURI: (document: Document, baseURI: string | null) => (
        (document.#baseURI = baseURI), document
      ),
      getURL: (document: Document) => document.#url,
      setURL: (document: Document, url: string | null) => (
        (document.#url = url), document
      ),
      getImplementation: (document: Document) => document.#implementation,
      setImplementation: (
        document: Document,
        implementation: DOMImplementation | null,
      ) => (
        (document.#implementation = implementation), document
      ),
      getStyleSheets(document: Document): CSSStyleSheetList {
        return document.#styleSheets ??= new CSSStyleSheetList();
      },
      setStyleSheets(
        document: Document,
        styleSheets: CSSStyleSheetList | null | undefined,
      ): void {
        document.#styleSheets = styleSheets ?? new CSSStyleSheetList();
      },
    };
  }

  static {
    toStringTag("Document")(this);
  }
}

export class HTMLDocument extends Document {
  constructor() {
    super(...([_.keys._private] as unknown as []));
    _.enforcePrivateConstructor({ arguments });
    _.Document.setContentType(this, "text/html");
    _.Document.setQuirksMode(this, "no-quirks");
    _.Node.setNamespaceURI(this, XHTML_NAMESPACE);
  }

  protected override [clone_shallow](): HTMLDocument {
    return _.Document.create(
      HTMLDocument,
      "text/html",
      "no-quirks",
      XHTML_NAMESPACE,
      _.Document.getBaseURI(this),
    );
  }

  declare readonly [SymbolToStringTag]: "HTMLDocument";

  static {
    toStringTag("HTMLDocument")(this);
  }
}

export class XMLDocument extends Document {
  constructor() {
    super(...([_.keys._private] as unknown as []));
    _.enforcePrivateConstructor({ arguments });
    _.Document.setContentType(this, "application/xml");
    _.Document.setQuirksMode(this, "no-quirks");
    _.Node.setNamespaceURI(this, XML_NAMESPACE);
  }

  protected override [clone_shallow](): XMLDocument {
    return _.Document.create(
      XMLDocument,
      "application/xml",
      "no-quirks",
      XML_NAMESPACE,
      _.Document.getBaseURI(this),
    );
  }

  declare readonly [SymbolToStringTag]: "XMLDocument";

  static {
    toStringTag("XMLDocument")(this);
  }
}
