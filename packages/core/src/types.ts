import {
  child_nodes,
  first_child,
  last_child,
  node_type,
  parent_node,
} from "dawm-internal/keys";

export {
  isAttr,
  isCDATASection,
  isComment,
  isDocument,
  isDocumentFragment,
  isDocumentType,
  isDOMNode,
  isElement,
  isNodeLike,
  isProcessingInstruction,
  isText,
} from "dawm-internal/guards";

export enum NodeType {
  Element = 1,
  Attribute = 2,
  Text = 3,
  CDATASection = 4,
  EntityReference = 5,
  Entity = 6,
  ProcessingInstruction = 7,
  Comment = 8,
  Document = 9,
  DocumentType = 10,
  DocumentFragment = 11,
  Notation = 12,
}

// deno-lint-ignore no-namespace
export namespace NodeType {
  const NodeTypeString = {
    [NodeType.Element]: "Element",
    [NodeType.Attribute]: "Attribute",
    [NodeType.Text]: "Text",
    [NodeType.CDATASection]: "CDATASection",
    [NodeType.EntityReference]: "EntityReference",
    [NodeType.Entity]: "Entity",
    [NodeType.ProcessingInstruction]: "ProcessingInstruction",
    [NodeType.Comment]: "Comment",
    [NodeType.Document]: "Document",
    [NodeType.DocumentType]: "DocumentType",
    [NodeType.DocumentFragment]: "DocumentFragment",
    [NodeType.Notation]: "Notation",
  } as const;
  type NodeTypeString = typeof NodeTypeString;

  export function toString<T extends NodeType>(type: T): NodeTypeString[T] {
    return NodeTypeString[type];
  }
}

export enum QuirksMode {
  Quirks = 0,
  LimitedQuirks = 1,
  NoQuirks = 2,
}

export type QuirksModeType = "no-quirks" | "quirks" | "limited-quirks";

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

/**
 * Common ancestor type shared by all {@linkcode Node}-like interfaces.
 *
 * @category Types
 * @tags Node
 */
export interface NodeLike<
  Type extends NodeType = NodeType,
> {
  readonly nodeType: Type;
}

export interface DOMNode<
  Type extends NodeType = NodeType,
> extends NodeLike<Type> {
  readonly [node_type]: Type;
}

export interface ParentNodeLike<
  Type extends NodeType = NodeType,
  TChild extends NodeLike = NodeLike,
  TParent extends NodeLike | null = NodeLike | null,
> extends DOMNode<Type> {
  readonly [child_nodes]: NodeLikeCollection<TChild>;
  readonly [parent_node]: TParent;
  readonly [first_child]: TChild;
  readonly [last_child]: TChild;
}

export interface NodeLikeCollection<
  T extends NodeLike = NodeLike,
> {
  [index: number]: T;
  readonly length: number;
  item(index: number): T | null;
}
