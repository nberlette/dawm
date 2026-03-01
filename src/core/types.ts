import {
  inRange,
  isObject,
  isPositiveNonZeroFiniteInteger,
} from "../_internal.ts";
import { NodeType, QuirksMode } from "../wasm.ts";
import {
  child_nodes,
  first_child,
  last_child,
  node_type,
  owner_document,
  parent_node,
} from "../internal/keys.ts";
import type {
  Attr,
  CDATASection,
  Comment,
  Document,
  DocumentFragment,
  DocumentType,
  Element,
  ProcessingInstruction,
  Text,
} from "./index.ts";

export { NodeType, QuirksMode };

export type QuirksModeType = "no-quirks" | "quirks" | "limited-quirks";

type NodeTypeMap = readonly [
  never, // 0 (padding)
  Element, // 1
  Attr, // 2
  Text, // 3
  CDATASection, // 4
  never, // 5 (EntityReference)
  never, // 6 (Entity)
  ProcessingInstruction, // 7
  Comment, // 8
  Document, // 9
  DocumentType, // 10
  DocumentFragment, // 11
  never, // 12 (Notation)
];

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

export function isNodeLike(
  it: unknown,
): it is NodeLike {
  return isObject(it) && "nodeType" in it && isNodeType(it.nodeType);
}

export function isNodeType(it: unknown): it is NodeType {
  return (
    typeof it === "number" && it === it &&
    isPositiveNonZeroFiniteInteger(it) &&
    inRange(it, 1, 12)
  );
}

export interface DOMNode<
  Type extends NodeType = NodeType,
> extends NodeLike<Type> {
  readonly [node_type]: Type;
}

export function isDOMNode<Type extends NodeType = NodeType>(
  it: unknown,
  type: Type,
): it is NodeTypeMap[Type];
export function isDOMNode<Type extends NodeType = NodeType>(
  it: unknown,
  type?: Type,
): it is DOMNode<Type>;
export function isDOMNode<Type extends NodeType = NodeType>(
  it: unknown,
  type?: Type,
): it is DOMNode<Type> {
  return isNodeLike(it) && node_type in it && isNodeType(it[node_type]) &&
    (!type || it[node_type] === type);
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
