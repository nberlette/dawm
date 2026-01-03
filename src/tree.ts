import {
  INTERNED_STRINGS,
  isArray,
  ObjectDefineProperty,
} from "./_internal.ts";
import { createNamedNodeMap } from "./collections.ts";
import {
  Attr,
  CDATASection,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  GenericNode,
  HTMLDocument,
  isNodeLike,
  type Node,
  NodeType,
  QuirksMode,
  type QuirksModeType,
  Text,
  XMLDocument,
} from "./dom.ts";
import {
  isResolvedWireNode,
  isWireDoc,
  type ResolvedWire,
  type ResolvedWireAttr,
  type ResolvedWireDoc,
  type ResolvedWireNode,
  type Wire,
  type WireAttr,
  type WireDoc,
  type WireNode,
} from "./wire.ts";

interface BuildTreeContext {
  lookup: Map<number, ResolvedWireNode>;
  strings: readonly string[];
  contentType: string;
  quirksMode: QuirksModeType;
  document: Document | null;
  namespaceURI?: string | null;
  baseURI?: string | null;
}

function instantiateDomNode(
  node: ResolvedWireNode,
  context: BuildTreeContext,
): Node {
  if (!context.document && node.nodeType !== NodeType.Document) {
    throw new TypeError(
      "Cannot instantiate non-document node without a document context.",
    );
  }
  if (!context.namespaceURI) {
    if (context.document?.namespaceURI) {
      context.namespaceURI = context.document.namespaceURI;
    } else {
      const contentType = context.document?.contentType ?? context.contentType;
      switch (contentType) {
        case "application/xhtml+xml":
        case "image/svg+xml":
        case "application/mathml+xml":
          context.namespaceURI = "http://www.w3.org/1999/xhtml";
          break;
        case "application/xml":
        case "text/xml":
          context.namespaceURI = "http://www.w3.org/XML/1998/namespace";
          break;
        default:
          context.namespaceURI = null;
      }
    }
  }
  let instance: Node;
  switch (node.nodeType) {
    case NodeType.Document: {
      let doc: Document;
      if (context.contentType === "text/html") {
        doc = new HTMLDocument();
      } else if (context.contentType === "application/xhtml+xml") {
        doc = new Document(
          context.contentType,
          context.quirksMode,
          "http://www.w3.org/1999/xhtml",
          context.baseURI,
        );
      } else {
        doc = new XMLDocument();
      }
      context.document = doc;
      defineInternedStrings(doc, context.strings);
      instance = doc;
      break;
    }
    case NodeType.Element: {
      instance = new Element(node.nodeName ?? "");
      instance.namespaceURI = context.namespaceURI;
      instance.attributes = createNamedNodeMap(
        instance as Element,
        (node.attributes ?? []).map((attr) =>
          new Attr(
            attr.name,
            attr.value ?? "",
            attr.ns ?? context.namespaceURI,
            instance as Element,
          )
        ),
      );
      break;
    }
    case NodeType.Text:
      instance = new Text(node.nodeValue ?? "");
      break;
    case NodeType.DocumentFragment:
      instance = new DocumentFragment();
      break;
    case NodeType.DocumentType: {
      const publicAttr = node.attributes?.find((attr) =>
        attr.name === "publicId"
      );
      const systemAttr = node.attributes?.find((attr) =>
        attr.name === "systemId"
      );
      let docType = context.document?.createDocumentType(
        node.nodeName ?? "",
        publicAttr?.value ?? "",
        systemAttr?.value ?? "",
      );
      docType ??= new DocumentType(
        node.nodeName ?? "",
        publicAttr?.value ?? "",
        systemAttr?.value ?? "",
      );
      docType.ownerDocument = context.document!;
      docType.namespaceURI = context.namespaceURI;
      instance = docType;
      break;
    }
    case NodeType.Attribute:
      {
        let attr = context.document?.createAttributeNS(
          context.namespaceURI,
          node.nodeName ?? "",
          node.nodeValue ?? "",
        );
        attr ??= new Attr(
          node.nodeName ?? "",
          node.nodeValue ?? "",
          context.namespaceURI,
        );
        attr.ownerDocument = context.document!;
        attr.namespaceURI = context.namespaceURI;
        instance = attr;
      }
      break;
    case NodeType.CData:
      {
        let cdata = context.document?.createCDATASection(node.nodeValue ?? "");
        cdata ??= new CDATASection(node.nodeValue ?? "");
        cdata.ownerDocument = context.document!;
        cdata.namespaceURI = context.namespaceURI;
        instance = cdata;
      }
      break;
    default:
      instance = new GenericNode(
        node.nodeType,
        node.nodeName ?? "",
        node.nodeValue ?? null,
      );
  }

  if (instance.nodeType !== NodeType.Document) {
    instance.ownerDocument = context.document;
  }

  return instance;
}

function defineInternedStrings(
  doc: Document,
  strings: readonly string[],
): void {
  ObjectDefineProperty(doc, INTERNED_STRINGS, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: strings,
  });
}

function readInternedStrings(n: Node | null): readonly string[] {
  if (n) {
    const doc = n.nodeType === NodeType.Document ? n : n.ownerDocument;
    if (doc) {
      // deno-lint-ignore no-explicit-any
      const strings = (doc as any)[INTERNED_STRINGS];
      if (isArray<string>(strings)) return strings;
    }
  }
  return [];
}

export function buildSubtree(
  node: WireNode | ResolvedWireNode,
  parent: Node | null = null,
  prev: Node | null = null,
  next: Node | null = null,
  context?: BuildTreeContext,
): Node {
  let activeContext = context;
  if (!activeContext) {
    if (!isResolvedWireNode(node)) {
      throw new TypeError(
        "A build context is required when supplying unresolved wire nodes.",
      );
    }
    activeContext = {
      lookup: new Map([[node.id, node]]),
      strings: readInternedStrings(parent),
      contentType: parent?.ownerDocument?.contentType ?? "text/html",
      quirksMode: parent?.ownerDocument?.quirksMode ?? "no-quirks",
      document: parent?.ownerDocument ?? null,
    };
  }

  const resolved = isResolvedWireNode(node)
    ? node
    : resolveStrings(node, activeContext.strings);

  const domNode = instantiateDomNode(resolved, activeContext);

  if (parent) {
    const reference = next && next.parentNode === parent
      ? next
      : prev?.nextSibling ?? null;
    if (reference) {
      parent.insertBefore(domNode, reference);
    } else {
      parent.appendChild(domNode);
    }
  }

  let childId = resolved.firstChild;
  let previousChild: Node | null = null;
  while (childId != null) {
    const childWire = activeContext.lookup.get(childId);
    if (!childWire) break;
    previousChild = buildSubtree(
      childWire,
      domNode,
      previousChild,
      null,
      activeContext,
    );
    childId = childWire.nextSibling;
  }

  return domNode;
}

export function buildDocumentTree(document: WireDoc): Document {
  if (!isWireDoc(document)) {
    throw new TypeError("Expected a serialized wire document.");
  }

  const resolved = resolveStrings(document) as ResolvedWireDoc;
  const lookup = new Map<number, ResolvedWireNode>();
  for (const node of resolved.nodes) {
    lookup.set(node.id, node);
  }

  const root = resolved.nodes.find((node) =>
    node.nodeType === NodeType.Document
  );
  if (!root) throw new TypeError("Document root node not found.");

  const { strings, contentType, quirksMode } = resolved;
  const context: BuildTreeContext = {
    lookup,
    strings,
    contentType,
    quirksMode,
    document: null,
  };

  context.document = buildSubtree(root, null, null, null, context) as Document;
  if (context.document.nodeType !== NodeType.Document) {
    throw new TypeError("Parsed tree did not produce a document node.");
  }

  defineInternedStrings(context.document, resolved.strings);
  return context.document;
}

export function resolveQuirksMode(
  mode: number | string | null | undefined,
): QuirksModeType {
  if (typeof mode === "string") {
    mode = mode.toLocaleLowerCase().trim();
  }
  switch (mode) {
    case "quirks":
    case QuirksMode.Quirks:
      return "quirks";
    case "limited":
    case "limited-quirks":
    case "limitedquirks":
    case QuirksMode.LimitedQuirks:
      return "limited-quirks";
    default:
      return "no-quirks";
  }
}

export function resolveStrings(node: WireDoc): ResolvedWireDoc;
export function resolveStrings(
  node: WireNode,
  strings: readonly string[],
): ResolvedWireNode;
export function resolveStrings(
  node: WireAttr,
  strings: readonly string[],
): ResolvedWireAttr;
export function resolveStrings(
  wire: Wire,
  strings?: readonly string[],
): ResolvedWire;
export function resolveStrings(
  node: Wire,
  strings: readonly string[] = [],
): ResolvedWire {
  if (typeof node === "object" && node != null) {
    if ("strings" in node) {
      strings = node.strings;
      if (!Object.isFrozen(strings)) Object.freeze(strings);
      const { contentType, quirksMode: quirks } = node;
      const quirksMode = resolveQuirksMode(quirks);
      const nodes = node.nodes.map((n) => resolveStrings(n, strings));
      return {
        contentType,
        quirksMode,
        strings,
        nodes,
      } satisfies ResolvedWireDoc;
    } else if (isNodeLike(node)) {
      const { id, nodeType, nodeName, nodeValue, attributes } = node;
      return {
        id,
        nodeType,
        nodeName: nodeName != null ? strings[nodeName] ?? "" : null,
        nodeValue: nodeValue != null ? strings[nodeValue] ?? "" : null,
        parentNode: node.parentNode ?? null,
        firstChild: node.firstChild ?? null,
        nextSibling: node.nextSibling ?? null,
        attributes: attributes?.map((a) => resolveStrings(a, strings)) ?? null,
      } satisfies ResolvedWireNode;
    } else if ("name" in node) {
      const { name: nameIdx, ns: nsIdx, value: valueIdx } = node;
      const ns = nsIdx != null ? strings[nsIdx] : null;
      const name = strings[nameIdx];
      const value = valueIdx != null ? strings[valueIdx] : null;

      return { ns, name, value } satisfies ResolvedWireAttr;
    }
  }

  throw new TypeError("Invalid wire format");
}
