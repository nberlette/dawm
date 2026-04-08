import _, {
  defineConstants,
  defineGetters,
  SymbolToStringTag,
  toStringTag,
} from "dawm-internal";
import { DOMRect } from "./geometry/DOMRect.ts";
import { AbstractRange } from "./AbstractRange.ts";
import {
  clampCmp,
  cloneSubtreeBetween,
  comparePoints,
  concatText,
  createFragmentFrom,
  createTextFrom,
  firstPointIn,
  getIndex,
  hasChildren,
  hasParent,
  isAncestor,
  isText,
  lastPointIn,
  pathToRoot,
  pointAfterNode,
  pointBeforeNode,
  removeRange,
  splitText,
} from "./_range_helpers.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { Node } from "./Node.ts";
import { DOMException } from "./DOMException.ts";

const NODE_BEFORE = 0 as const;
type NODE_BEFORE = typeof NODE_BEFORE;

const NODE_AFTER = 1 as const;
type NODE_AFTER = typeof NODE_AFTER;

const NODE_BEFORE_AND_AFTER = 2 as const;
type NODE_BEFORE_AND_AFTER = typeof NODE_BEFORE_AND_AFTER;

const NODE_INSIDE = 3 as const;
type NODE_INSIDE = typeof NODE_INSIDE;

type NodeCompare =
  | NODE_BEFORE
  | NODE_AFTER
  | NODE_BEFORE_AND_AFTER
  | NODE_INSIDE;

declare module "dawm-internal" {
  export interface RangeInternal {
    getStartContainer<T extends Range>(range: T): T["startContainer"];
    setStartContainer<T extends Range>(range: T, node: Node): T;
    getStartOffset<T extends Range>(range: T): T["startOffset"];
    setStartOffset<T extends Range>(range: T, offset: number): T;
    getEndContainer<T extends Range>(range: T): T["endContainer"];
    setEndContainer<T extends Range>(range: T, node: Node): T;
    getEndOffset<T extends Range>(range: T): T["endOffset"];
    setEndOffset<T extends Range>(range: T, offset: number): T;
    getDetached<T extends Range>(range: T): boolean;
    setDetached<T extends Range>(range: T, detached: boolean): T;
    setStart(range: Range, node: Node, offset: number): void;
    setEnd(range: Range, node: Node, offset: number): void;
    collapseToStart(range: Range): void;
    collapseToEnd(range: Range): void;
    selectNode(range: Range, node: Node): void;
    selectNodeContents(range: Range, node: Node): void;
    isAncestor(anc: Node, node: Node | null): boolean;
    comparePoints(
      a: { container: Node; offset: number },
      b: { container: Node; offset: number },
    ): number;
  }

  export interface internal {
    Range: RangeInternal;
  }
}

/** [MDN Reference](https://mdn.io/Range) */
export class Range extends AbstractRange {
  static readonly START_TO_START = 0 as const;
  static readonly START_TO_END = 1 as const;
  static readonly END_TO_END = 2 as const;
  static readonly END_TO_START = 3 as const;

  #startContainer: Node;
  #startOffset: number;
  #endContainer: Node;
  #endOffset: number;
  #detached = false;

  constructor(
    startContainer: Node,
    startOffset: number,
    endContainer?: Node,
    endOffset?: number,
  ) {
    super();

    this.#startContainer = startContainer;
    this.#startOffset = startOffset | 0;
    this.#endContainer = endContainer ?? startContainer;
    this.#endOffset = endOffset ?? startOffset;
    this.#detached = false;

    if (
      comparePoints(
        { container: this.#startContainer, offset: this.#startOffset },
        { container: this.#endContainer, offset: this.#endOffset },
      ) > 0
    ) {
      const sc = this.#startContainer;
      const so = this.#startOffset;
      this.#startContainer = this.#endContainer;
      this.#startOffset = this.#endOffset;
      this.#endContainer = sc;
      this.#endOffset = so;
    }
  }

  get startContainer(): Node {
    return this.#startContainer;
  }

  get startOffset(): number {
    return this.#startOffset;
  }

  get endContainer(): Node {
    return this.#endContainer;
  }

  get endOffset(): number {
    return this.#endOffset;
  }

  get commonAncestorContainer(): Node {
    const a = pathToRoot(this.#startContainer);
    const b = pathToRoot(this.#endContainer);
    let ca: Node = a[0]!;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      if (a[i] === b[i]) ca = a[i]!;
      else break;
    }
    return ca;
  }

  get text(): string {
    return this.toString();
  }

  cloneContents(): DocumentFragment {
    this.#ensureAlive();
    return cloneSubtreeBetween(
      { container: this.#startContainer, offset: this.#startOffset },
      { container: this.#endContainer, offset: this.#endOffset },
    );
  }

  cloneRange(): Range {
    return new Range(
      this.#startContainer,
      this.#startOffset,
      this.#endContainer,
      this.#endOffset,
    );
  }

  collapse(toStart?: boolean): void {
    this.#ensureAlive();
    if (toStart) {
      this.#endContainer = this.#startContainer;
      this.#endOffset = this.#startOffset;
    } else {
      this.#startContainer = this.#endContainer;
      this.#startOffset = this.#endOffset;
    }
  }

  compareBoundaryPoints(how: Range.How, src: Range): number {
    this.#ensureAlive();
    const aS = { container: this.#startContainer, offset: this.#startOffset };
    const aE = { container: this.#endContainer, offset: this.#endOffset };
    const bS = { container: src.startContainer, offset: src.startOffset };
    const bE = { container: src.endContainer, offset: src.endOffset };
    switch (how) {
      case Range.START_TO_START:
        return clampCmp(comparePoints(aS, bS));
      case Range.START_TO_END:
        return clampCmp(comparePoints(aS, bE));
      case Range.END_TO_END:
        return clampCmp(comparePoints(aE, bE));
      case Range.END_TO_START:
        return clampCmp(comparePoints(aE, bS));
      default:
        throw new Error("Invalid comparison mode");
    }
  }

  compareNode(refNode: Node): number {
    this.#ensureAlive();
    const s = { container: this.#startContainer, offset: this.#startOffset };
    const e = { container: this.#endContainer, offset: this.#endOffset };
    const before = comparePoints(pointAfterNode(refNode), s) <= 0;
    const after = comparePoints(pointBeforeNode(refNode), e) >= 0;

    if (before && !after) return NODE_BEFORE;
    if (!before && after) return NODE_AFTER;

    const inside = comparePoints(pointBeforeNode(refNode), s) >= 0 &&
      comparePoints(pointAfterNode(refNode), e) <= 0;
    return inside ? NODE_INSIDE : NODE_BEFORE_AND_AFTER;
  }

  comparePoint(refNode: Node, offset: number): number {
    this.#ensureAlive();
    const p = { container: refNode, offset: offset | 0 };
    const s = { container: this.#startContainer, offset: this.#startOffset };
    const e = { container: this.#endContainer, offset: this.#endOffset };
    if (comparePoints(p, s) < 0) return -1;
    if (comparePoints(p, e) > 0) return 1;
    return 0;
  }

  createContextualFragment(html: string): DocumentFragment {
    const frag = createFragmentFrom(this.#startContainer);
    const text = createTextFrom(this.#startContainer, String(html));
    frag.appendChild(text);
    return frag;
  }

  deleteContents(): void {
    this.#ensureAlive();
    const _ = removeRange(
      { container: this.#startContainer, offset: this.#startOffset },
      { container: this.#endContainer, offset: this.#endOffset },
    );
    this.#endContainer = this.#startContainer;
    this.#endOffset = this.#startOffset;
  }

  detach(): void {
    this.#detached = true;
  }

  extractContents(): DocumentFragment {
    this.#ensureAlive();
    const frag = removeRange(
      { container: this.#startContainer, offset: this.#startOffset },
      { container: this.#endContainer, offset: this.#endOffset },
    );
    this.#endContainer = this.#startContainer;
    this.#endOffset = this.#startOffset;
    return frag;
  }

  getBoundingClientRect(): DOMRect {
    this.#ensureAlive();
    const rects = [...this.getClientRects()];
    if (rects.length === 0) return new DOMRect(0, 0, 0, 0);

    let x = rects[0]?.x ?? 0;
    let y = rects[0]?.y ?? 0;
    let width = rects[0]?.width ?? 0;
    let height = rects[0]?.height ?? 0;

    // compute the overall bounding box for all child rects
    for (const r of rects) {
      x = Math.min(x, r.x);
      y = Math.min(y, r.y);
      width = Math.max(width, r.width);
      height = Math.max(height, r.height);
    }

    return new DOMRect(x, y, width, height);
  }

  *getClientRects(): Iterable<DOMRect> {
    this.#ensureAlive();

    const rects: DOMRect[] = [];
    // aggregate rects from all elements within the range
    const frag = this.cloneContents();
    for (let k = frag.firstChild; k; k = k.nextSibling) {
      if ("getClientRects" in k && typeof k.getClientRects === "function") {
        for (const r of k.getClientRects()) {
          rects.push(r);
          yield r;
        }
      } else if (
        "getBoundingClientRect" in k &&
        typeof k.getBoundingClientRect === "function"
      ) {
        const r = k.getBoundingClientRect();
        rects.push(r);
        yield r;
      }
    }

    // ensure we return at least ONE rect...
    if (rects.length === 0) {
      const r = new DOMRect(0, 0, 0, 0);
      rects.push(r);
      yield r;
    }

    return rects;
  }

  insertNode(newNode: Node): void {
    this.#ensureAlive();
    const sc = this.#startContainer;
    const so = this.#startOffset;

    if (isText(sc)) {
      const right = splitText(sc, so);
      if (!hasParent(right) || !hasChildren(right.parentNode)) {
        throw new Error("insertNode: cannot insert into text parent");
      }
      const parent = right.parentNode;
      parent.insertBefore(newNode, right);

      const before = pointBeforeNode(newNode);
      const after = pointAfterNode(newNode);
      this.#startContainer = before.container;
      this.#startOffset = before.offset;
      this.#endContainer = after.container;
      this.#endOffset = after.offset;
      return;
    }

    if (!hasChildren(sc)) throw new Error("insertNode: no child surface");
    const kids = sc.childNodes;
    const ref = kids[so] ?? null;
    sc.insertBefore(newNode, ref);
  }

  intersectsNode(refNode: Node): boolean {
    this.#ensureAlive();
    const s = { container: this.#startContainer, offset: this.#startOffset };
    const e = { container: this.#endContainer, offset: this.#endOffset };
    return comparePoints(pointBeforeNode(refNode), e) < 0 &&
      comparePoints(pointAfterNode(refNode), s) > 0;
  }

  isPointInRange(refNode: Node, offset: number): boolean {
    return this.comparePoint(refNode, offset) === 0;
  }

  selectNode(refNode: Node): void {
    this.#ensureAlive();
    const b = pointBeforeNode(refNode);
    const a = pointAfterNode(refNode);
    this.#startContainer = b.container;
    this.#startOffset = b.offset;
    this.#endContainer = a.container;
    this.#endOffset = a.offset;
  }

  selectNodeContents(refNode: Node): void {
    this.#ensureAlive();
    const f = firstPointIn(refNode);
    const l = lastPointIn(refNode);
    this.#startContainer = f.container;
    this.#startOffset = f.offset;
    this.#endContainer = l.container;
    this.#endOffset = l.offset;
  }

  setEnd(refNode: Node, offset: number): void {
    this.#ensureAlive();
    const ne = { container: refNode, offset: offset | 0 };
    const s = { container: this.#startContainer, offset: this.#startOffset };
    if (comparePoints(s, ne) <= 0) {
      this.#endContainer = refNode;
      this.#endOffset = ne.offset;
    } else {
      this.#startContainer = refNode;
      this.#startOffset = ne.offset;
      this.#endContainer = refNode;
      this.#endOffset = ne.offset;
    }
  }

  setEndBefore(refNode: Node): void {
    if (!hasParent(refNode) || !hasChildren(refNode.parentNode)) {
      throw new Error("setEndBefore: no parent");
    }
    this.setEnd(refNode.parentNode, getIndex(refNode));
  }

  setEndAfter(refNode: Node): void {
    if (!hasParent(refNode) || !hasChildren(refNode.parentNode)) {
      throw new Error("setEndAfter: no parent");
    }
    this.setEnd(refNode.parentNode, getIndex(refNode) + 1);
  }

  setStart(refNode: Node, offset: number): void {
    this.#ensureAlive();
    offset |= 0;

    const n = { container: refNode, offset };
    const e = { container: this.#endContainer, offset: this.#endOffset };

    this.#startContainer = refNode;
    this.#startOffset = n.offset;

    if (comparePoints(n, e) > 0) {
      this.#endContainer = refNode;
      this.#endOffset = n.offset;
    }
  }

  setStartBefore(refNode: Node): void {
    if (!hasParent(refNode) || !hasChildren(refNode.parentNode)) {
      throw new Error("setStartBefore: no parent");
    }
    this.setStart(refNode.parentNode, getIndex(refNode));
  }

  setStartAfter(refNode: Node): void {
    if (!hasParent(refNode) || !hasChildren(refNode.parentNode)) {
      throw new Error("setStartAfter: no parent");
    }
    this.setStart(refNode.parentNode, getIndex(refNode) + 1);
  }

  surroundContents(newParent: Node): void {
    this.#ensureAlive();
    const contents = this.extractContents();
    this.insertNode(newParent);
    if (newParent.appendChild) {
      for (let n = contents?.firstChild ?? null; n; n = n.nextSibling) {
        newParent.appendChild(n);
      }
    }
    this.selectNode(newParent);
  }

  override toString(): string {
    const frag = this.cloneContents();
    let node: Node | null = frag?.firstChild ?? null;
    let out = "";
    while (node) {
      out += concatText(node);
      node = node.nextSibling;
    }
    return out;
  }

  declare readonly [SymbolToStringTag]: "Range";

  #ensureAlive = (): void => {
    if (this.#detached) {
      throw new DOMException("Range is detached", "InvalidStateError");
    }
  };

  declare readonly START_TO_START: 0;
  declare readonly START_TO_END: 1;
  declare readonly END_TO_END: 2;
  declare readonly END_TO_START: 3;

  static {
    toStringTag("Range")(this);
    defineConstants(
      Range,
      ["START_TO_START", 0],
      ["START_TO_END", 1],
      ["END_TO_END", 2],
      ["END_TO_START", 3],
    );

    defineGetters(this.prototype, {
      collapsed: (range) =>
        !comparePoints(
          { container: range.#startContainer, offset: range.#startOffset },
          { container: range.#endContainer, offset: range.#endOffset },
        ),
    });
  }

  static {
    _.Range = {
      getStartContainer: (r) => r.#startContainer,
      setStartContainer: (r, n) => (r.#startContainer = n, r),
      getStartOffset: (r) => r.#startOffset,
      setStartOffset: (r, n) => (r.#startOffset = n | 0, r),
      getEndContainer: (r) => r.#endContainer,
      setEndContainer: (r, n) => (r.#endContainer = n, r),
      getEndOffset: (r) => r.#endOffset,
      setEndOffset: (r, n) => (r.#endOffset = n | 0, r),
      getDetached: (r) => r.#detached,
      setDetached: (r, d) => (r.#detached = d, r),
      setStart(range, node, offset) {
        range.#startContainer = node;
        range.#startOffset = offset | 0;
      },
      setEnd(range, node, offset) {
        range.#endContainer = node;
        range.#endOffset = offset | 0;
      },
      collapseToStart(range) {
        range.#endContainer = range.#startContainer;
        range.#endOffset = range.#startOffset;
      },
      collapseToEnd(range) {
        range.#startContainer = range.#endContainer;
        range.#startOffset = range.#endOffset;
      },
      selectNode(range, node) {
        const b = pointBeforeNode(node);
        const a = pointAfterNode(node);
        range.#startContainer = b.container;
        range.#startOffset = b.offset;
        range.#endContainer = a.container;
        range.#endOffset = a.offset;
      },
      selectNodeContents(range, node) {
        const f = firstPointIn(node);
        const l = lastPointIn(node);
        range.#startContainer = f.container;
        range.#startOffset = f.offset;
        range.#endContainer = l.container;
        range.#endOffset = l.offset;
      },
      isAncestor,
      comparePoints,
    };
  }
}

export declare namespace Range {
  export type START_TO_START = typeof Range.START_TO_START;
  export type START_TO_END = typeof Range.START_TO_END;
  export type END_TO_END = typeof Range.END_TO_END;
  export type END_TO_START = typeof Range.END_TO_START;

  export type How = START_TO_START | START_TO_END | END_TO_END | END_TO_START;
}
