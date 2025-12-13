import { isArray, isInteger, isObject, isString } from "./_internal.ts";
import { isNodeLike, type NodeLike, type NodeType } from "./dom.ts";
import type { QuirksMode, QuirksModeType } from "./types.ts";

/**
 * Represents the serialized form of a DOM node used for efficient
 * transmission or storage. This is the raw "wire" format returned by the
 * WebAssembly parser, before any string resolution or hierarchical
 * structuring has been applied.
 *
 * @see {@linkcode ResolvedWireNode} for the version with strings resolved.
 * @see {@linkcode Node} for the final DOM-like Node structure with strings
 * resolved and hierarchical relationships established.
 * @category Types
 * @tags Wire, Node
 */
export interface WireNode extends NodeLike {
  id: number;
  nodeName: number | undefined;
  nodeValue: number | undefined;
  parentNode: number | undefined;
  firstChild: number | undefined;
  nextSibling: number | undefined;
  attributes: WireAttr[] | undefined;
}

/**
 * Represents the serialized form of a DOM attribute used for efficient
 * transmission or storage.
 *
 * This is the raw "wire" format returned by the WebAssembly parser, before any
 * string resolution has been applied.
 *
 * @see {@linkcode ResolvedWireAttr} for the version with strings resolved.
 * @see {@linkcode Attr} for the final DOM-like Attr structure.
 * @category Types
 * @tags Wire, Attribute
 */
export interface WireAttr {
  ns: number | undefined;
  name: number;
  value: number | undefined;
}

/**
 * Represents the serialized form of a DOM document used for efficient
 * transmission or storage.
 *
 * This is the raw "wire" format returned by the WebAssembly parser, before any
 * string resolution or hierarchical structuring has been applied.
 *
 * @see {@linkcode ResolvedWireDoc} for the version with strings resolved.
 * @see {@linkcode Document} for the final DOM-like Document structure with
 * strings resolved and hierarchical relationships established.
 * @category Types
 * @tags Wire, Document
 */
export interface WireDoc {
  contentType: string;
  quirksMode: QuirksMode;
  strings: readonly string[];
  nodes: readonly WireNode[];
}

/**
 * Represents any of the possible "wire" types (document, node, or attribute)
 * returned by the WebAssembly parser prior to any string resolution.
 *
 * @category Types
 * @tags Wire
 */
export type Wire = WireDoc | WireNode | WireAttr;
// #endregion Wire Types

// #region Resolved Types

/**
 * Represents a DOM node with all of its strings resolved from integer indices
 * to actual string values.
 *
 * This is an intermediate form returned by the `resolveStrings` function,
 * before hierarchical relationships are established. Node references remain as
 * integer IDs, which are later used to establish inter-node relationships
 * (parent-child/sibling) by the `buildNodeTree` function.
 *
 * @see {@linkcode WireNode} for the raw wire format.
 * @see {@linkcode Node} for the final DOM-like Node structure.
 * @category Types
 * @tags Resolved, Node
 */
export interface ResolvedWireNode {
  id: number;
  nodeType: NodeType;
  nodeName: string | null;
  nodeValue: string | null;
  parentNode: number | null;
  firstChild: number | null;
  nextSibling: number | null;
  attributes: ResolvedWireAttr[] | null;
}

/**
 * Represents a DOM attribute with all of its strings resolved from integer
 * indices to actual string values.
 *
 * This is an intermediate form returned by the `resolveStrings` function,
 * before hierarchical relationships are established. Node references remain as
 * integer IDs, which are later used to establish inter-node relationships
 * (parent-child/sibling) by the `buildNodeTree` function.
 *
 * @see {@linkcode WireAttr} for the raw wire format.
 * @see {@linkcode Attr} for the final DOM-like Attr structure.
 * @category Types
 * @tags Resolved, Attribute
 */
export interface ResolvedWireAttr {
  ns: string | null;
  name: string;
  value: string | null;
}

/**
 * Represents a DOM document with all of its strings resolved from integer
 * indices to actual string values.
 *
 * This is an intermediate form returned by the `resolveStrings` function,
 * before hierarchical relationships are established. Node references remain as
 * integer IDs, which are later used to establish inter-node relationships
 * (parent-child/sibling) by the `buildNodeTree` function.
 *
 * @see {@linkcode WireDoc} for the raw wire format.
 * @see {@linkcode Document} for the final DOM-like Document structure.
 * @category Types
 * @tags Resolved, Document
 */
export interface ResolvedWireDoc {
  contentType: string;
  quirksMode: QuirksModeType;
  nodes: readonly ResolvedWireNode[];
  strings: readonly string[];
}

/**
 * Any of the possible "resolved wire" types (document, node, or attribute),
 * with all strings resolved from integer indices to actual string values.
 *
 * This is an intermediate form returned by the `resolveStrings` function,
 * before hierarchical relationships are established by `buildNodeTree`.
 *
 * @category Types
 * @tags Resolved
 */
export type ResolvedWire =
  | ResolvedWireDoc
  | ResolvedWireNode
  | ResolvedWireAttr;
// #endregion Resolved Types

// #region guards
export function isWireNode(it: unknown): it is WireNode {
  return isNodeLike(it) && "id" in it && (
    isInteger(it.id) && it.id >= 0
  ) && "attributes" in it && (
    it.attributes === null ||
    isArray(it.attributes, (n) => isWireAttr(n) || isResolvedWireAttr(n))
  ) && "parentNode" in it && (
    it.parentNode === null || isInteger(it.parentNode)
  ) && "firstChild" in it && (
    it.firstChild === null || isInteger(it.firstChild)
  ) && "nextSibling" in it && (
    it.nextSibling === null || isInteger(it.nextSibling)
  );
}

export function isWireDoc(it: unknown): it is WireDoc {
  return isObject(it) && "nodes" in it && "strings" in it;
}

export function isWireAttr(it: unknown): it is WireAttr {
  return isObject(it) &&
    ("name" in it && isInteger(it.name)) &&
    (!("ns" in it) || it.ns == null || isInteger(it.ns)) &&
    (!("value" in it) || it.value == null || isInteger(it.value));
}

export function isResolvedWireDoc(
  it: unknown,
): it is ResolvedWireDoc {
  return (
    isObject(it) &&
    "quirksMode" in it && isString(it.quirksMode) &&
    "contentType" in it && isString(it.contentType) &&
    "strings" in it && isArray(it.strings, isString) &&
    "nodes" in it && isArray(it.nodes, isResolvedWireNode)
  );
}

export function isResolvedWireNode(
  it: unknown,
): it is ResolvedWireNode {
  return isWireNode(it) && (
    it.attributes === null ||
    isArray(it.attributes, isResolvedWireAttr)
  ) && (
    "nodeName" in it && isString(it.nodeName)
  ) && (
    "nodeValue" in it && (it.nodeValue === null || isString(it.nodeValue))
  );
}

export function isResolvedWireAttr(
  it: unknown,
): it is ResolvedWireAttr {
  return isObject(it) &&
    ("name" in it && isString(it.name)) &&
    (!("ns" in it) || it.ns === null || isString(it.ns)) &&
    ("value" in it && (it.value === null || isString(it.value)));
}
// #endregion guards

export function toWireDoc(value: unknown): WireDoc {
  if (!isWireDoc(value)) {
    throw new TypeError("Parser returned an unexpected result.");
  }
  return value;
}
