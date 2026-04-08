import { _ } from "dawm-internal";
import type { Document } from "./Document.ts";
import type { Node } from "./Node.ts";
import type { ParentNode } from "./ParentNode.ts";
import { DOMException } from "./DOMException.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { Text } from "./Text.ts";

export type Boundary = { container: Node; offset: number };

export function hasChildren(n: Node | null): n is ParentNode {
  return !!n && n.childNodes != null && n.hasChildNodes?.() &&
    typeof n.insertBefore === "function" &&
    typeof n.removeChild === "function" &&
    typeof n.appendChild === "function";
}

export function hasParent<T extends Node>(
  n: T | null,
): n is T & { parentNode: T["parentNode"] & {} } {
  return !!n && "parentNode" in n && n.parentNode != null;
}

export function isText(n: Node | null): n is Text {
  return !!n && n.nodeType === /* Node.TEXT_NODE */ 3 &&
    "nodeValue" in n;
}

export function hasOwnerDoc(
  n: Node | null,
): n is Node & { ownerDocument: Document } {
  return !!n && !!n.ownerDocument &&
    typeof n.ownerDocument?.createDocumentFragment === "function";
}

export function getText(n: Text): string {
  return n.nodeValue ?? n.textContent ?? "";
}

export function setText(n: Text, s: string): void {
  n.nodeValue = s;
  n.textContent = s;
}

/** Create a fragment from node.ownerDocument or a tiny fallback. */
export function createFragmentFrom(base: Node | null): DocumentFragment {
  if (hasOwnerDoc(base)) {
    return base.ownerDocument.createDocumentFragment();
  }
  return _.DocumentFragment.new();
}

/** Create a text node using ownerDocument or a tiny fallback. */
export function createTextFrom(base: Node | null, data: string): Text {
  const node = base?.ownerDocument?.createTextNode(data) ?? new Text(data);
  _.Node.setOwnerDocument(node, base?.ownerDocument ?? null);
  return node;
}

export function getIndex(node: Node): number {
  if (!hasParent(node) || !hasChildren(node.parentNode)) return -1;
  const kids = node.parentNode.childNodes;
  for (let i = 0; i < kids.length; i++) {
    if (kids[i] === node) return i;
  }
  return -1;
}

export function isAncestor(anc: Node, node: Node | null): boolean {
  let cur: Node | null = node;
  while (cur) {
    if (cur === anc) return true;
    cur = cur.parentNode;
  }
  return false;
}

export function nodeLength(n: Node): number {
  if (isText(n)) return getText(n).length;
  return hasChildren(n) ? n.childNodes.length : 0;
}

export function pathToRoot(n: Node): Node[] {
  const path: Node[] = [];
  let cur: Node | null = n;
  while (cur) {
    path.unshift(cur);
    cur = hasParent(cur) ? cur.parentNode : null;
  }
  return path;
}

export function comparePoints(a: Boundary, b: Boundary): number {
  if (a.container === b.container) {
    return a.offset < b.offset ? -1 : a.offset > b.offset ? 1 : 0;
  }
  const aPath = pathToRoot(a.container);
  const bPath = pathToRoot(b.container);
  const len = Math.min(aPath.length, bPath.length);
  let i = 0;
  for (; i < len; i++) {
    if (aPath[i] !== bPath[i]) break;
  }
  if (i < len) {
    const aNode = aPath[i], bNode = bPath[i];
    if (!aNode || !bNode) {
      throw new DOMException(
        "Invalid tree: missing node in path",
        "HierarchyRequestError",
      );
    }
    if (!hasParent(aNode) || !hasChildren(aNode.parentNode)) {
      throw new DOMException(
        "Invalid tree: missing parent/children",
        "HierarchyRequestError",
      );
    }
    const kids = aNode.parentNode.childNodes;
    let aIdx = -1, bIdx = -1;
    for (let k = 0; k < kids.length; k++) {
      const kid = kids[k]!;
      if (kid === aNode) aIdx = k;
      if (kid === bNode) bIdx = k;
      if (aIdx !== -1 && bIdx !== -1) break;
    }
    return aIdx < bIdx ? -1 : 1;
  }
  if (aPath.length < bPath.length) {
    const child = bPath[i]!;
    const idx = getIndex(child);
    return a.offset <= idx ? -1 : 1;
  }
  const child = aPath[i]!;
  const idx = getIndex(child);
  return idx < b.offset ? -1 : 1;
}

export function pointBeforeNode(node: Node): Boundary {
  if (!hasParent(node) || !hasChildren(node.parentNode)) {
    throw new DOMException("Node has no parent", "InvalidStateError");
  }
  const idx = getIndex(node);
  return { container: node.parentNode, offset: idx };
}

export function pointAfterNode(node: Node): Boundary {
  if (!hasParent(node) || !hasChildren(node.parentNode)) {
    throw new DOMException("Node has no parent", "InvalidStateError");
  }
  const idx = getIndex(node);
  return { container: node.parentNode, offset: idx + 1 };
}

export function firstPointIn(node: Node): Boundary {
  if (isText(node)) return { container: node, offset: 0 };
  return { container: node, offset: 0 };
}

export function lastPointIn(node: Node): Boundary {
  if (isText(node)) return { container: node, offset: nodeLength(node) };
  return { container: node, offset: nodeLength(node) };
}

export function splitText(node: Text, offset: number): Node {
  return node.splitText(offset);
}

export function concatText(node: Node): string {
  if (isText(node)) return getText(node);
  if (!hasChildren(node)) return "";
  let out = "";
  for (const kid of node.childNodes) out += concatText(kid);
  return out;
}

export function clampCmp(n: number): number {
  return n < 0 ? -1 : n > 0 ? 1 : 0;
}

export function removeRange(start: Boundary, end: Boundary): DocumentFragment {
  const frag = createFragmentFrom(start.container);
  if (comparePoints(start, end) >= 0) return frag;

  let s: Boundary = { ...start };
  let e: Boundary = { ...end };

  if (isText(s.container)) {
    const sText = s.container;
    if (s.offset > 0 && s.offset < nodeLength(sText)) {
      const right = sText.splitText(s.offset);
      s = { container: right, offset: 0 };
      if (e.container === sText) {
        e = { container: right, offset: end.offset - start.offset };
      }
    }
  }
  if (isText(e.container)) {
    const eText = e.container;
    if (e.offset > 0 && e.offset < nodeLength(eText)) {
      eText.splitText(e.offset);
    }
  }

  if (s.container === e.container && isText(s.container)) {
    const textNode = s.container;
    const v = getText(textNode);
    const removed = v.slice(s.offset, e.offset);
    const node = createTextFrom(s.container, removed);
    // append into fragment
    frag.appendChild?.(node);
    const kept = v.slice(0, s.offset) + v.slice(e.offset);
    setText(textNode, kept);
    return frag;
  }

  const toExtract: Node[] = [];

  if (!isText(s.container) && hasChildren(s.container)) {
    const kids = s.container.childNodes;
    for (let i = s.offset; i < kids.length; i++) toExtract.push(kids[i]!);
  } else if (
    isText(s.container) && hasParent(s.container) &&
    hasChildren(s.container.parentNode)
  ) {
    const parent = s.container.parentNode;
    const kids = parent.childNodes;
    const startIdx = getIndex(s.container) + 1;
    for (let i = startIdx; i < kids.length; i++) toExtract.push(kids[i]!);
  }

  const beforeEnd = (n: Node): boolean =>
    comparePoints(pointBeforeNode(n), e) < 0;

  const trimmed: Node[] = [];
  for (const n of toExtract) if (beforeEnd(n)) trimmed.push(n);

  for (const n of trimmed) {
    if (!hasParent(n) || !hasChildren(n.parentNode)) continue;
    n.parentNode.removeChild(n);
    frag.appendChild(n);
  }

  if (!isText(e.container) && hasChildren(e.container)) {
    const ec = e.container;
    for (let i = 0; i < e.offset; i++) {
      const first = ec.childNodes[0];
      if (!first) break;
      const move = comparePoints(pointAfterNode(first), s) > 0;
      if (!move) break;
      ec.removeChild(first);
      frag.appendChild(first);
    }
  }

  return frag;
}

export function cloneSubtreeBetween(
  start: Boundary,
  end: Boundary,
): DocumentFragment {
  if (start.container === end.container && isText(start.container)) {
    const frag = createFragmentFrom(start.container);
    frag.appendChild(
      createTextFrom(
        start.container,
        getText(start.container).slice(start.offset, end.offset),
      ),
    );
    return frag;
  }

  const extracted = removeRange(start, end);
  const frag = createFragmentFrom(start.container);

  const movedKids = extracted?.childNodes ?? [];
  for (const n of movedKids) {
    const clone = "cloneNode" in n ? n.cloneNode(true) : n;
    frag.appendChild(clone);
  }

  // Best-effort reinsertion of removed nodes.
  if (!isText(start.container) && hasChildren(start.container)) {
    const anchor = start.container;
    const kids = anchor.childNodes;
    const ref = kids[start.offset] ?? null;
    for (const n of movedKids) {
      anchor.insertBefore(n, ref);
    }
  } else if (isText(start.container)) {
    const right = splitText(start.container, start.offset);
    if (hasParent(right) && hasChildren(right.parentNode)) {
      const parent = right.parentNode;
      for (const n of movedKids) parent.insertBefore(n, right);
    }
  }

  return frag;
}
