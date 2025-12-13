import {
  INTERNED_STRINGS,
  isArray,
  isString,
  ObjectDefineProperty,
} from "./_internal.ts";
import {
  Attr,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  GenericNode,
  isNodeLike,
  type Node,
  NodeType,
  QuirksMode,
  type QuirksModeType,
  Text,
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

// #endregion Concrete Types
interface BuildTreeContext {
  lookup: Map<number, ResolvedWireNode>;
  strings: readonly string[];
  contentType: string;
  quirksMode: QuirksModeType;
  document: Document | null;
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
  let instance: Node;
  switch (node.nodeType) {
    case NodeType.Document: {
      const doc = new Document(
        context.contentType,
        context.quirksMode,
      );
      context.document = doc;
      defineInternedStrings(doc, context.strings);
      instance = doc;
      break;
    }
    case NodeType.Element: {
      const attrs = (node.attributes ?? []).map((attr) =>
        new Attr(attr.name, attr.value ?? "", attr.ns ?? null)
      );
      instance = new Element(node.nodeName ?? "", attrs);
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
      const fn = context.document?.createDocumentType ??
        ((...args) => new DocumentType(...args));
      instance = fn(
        node.nodeName ?? "",
        publicAttr?.value ?? "",
        systemAttr?.value ?? "",
      );
      break;
    }
    case NodeType.Attribute:
      instance = new Attr(
        node.nodeName ?? "",
        node.nodeValue ?? "",
        null,
      );
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
