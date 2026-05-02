import { _, SymbolToStringTag, toStringTag } from "dawm-shared";
import { AbstractRange } from "./AbstractRange.ts";
import type { Node } from "../Node.ts";

/**
 * Represents a **static** range within a given `Document`, spanning from the
 * `startOffset` character within a given `startContainer` Node, through the
 * `endOffset` character within the `endOffset` Node.
 *
 * Unlike the standard {@linkcode Range} API (also known as "live ranges"), the
 * `StaticRange` API is immutable, and does not reflect changes to the original
 * document or root element. When performance overhead is a concern, static
 * ranges should be preferred over live ranges whenever possible. Note that the
 * API surface of this class lacks most of the functionality found in its live
 * counterpart, {@linkcode Range}.
 *
 * [MDN Reference](https://mdn.io/StaticRange)
 */
export class StaticRange extends AbstractRange {
  #startContainer: Node;
  #startOffset: number;
  #endContainer: Node;
  #endOffset: number;

  constructor(
    startContainer: Node,
    startOffset: number,
    endContainer: Node,
    endOffset: number,
  ) {
    super();
    this.#startContainer = startContainer;
    this.#startOffset = startOffset;
    this.#endContainer = endContainer;
    this.#endOffset = endOffset;
  }

  /**
   * Returns the range's start node.
   *
   * [MDN Reference](https://mdn.io/StaticRange/startContainer)
   */
  get startContainer(): Node {
    return this.#startContainer;
  }

  /**
   * Returns the range's start offset.
   *
   * [MDN Reference](https://mdn.io/StaticRange/startOffset)
   */
  get startOffset(): number {
    return this.#startOffset;
  }

  /**
   * Returns the range's end node.
   *
   * [MDN Reference](https://mdn.io/StaticRange/endContainer)
   */
  get endContainer(): Node {
    return this.#endContainer;
  }

  /**
   * Returns the range's end offset.
   *
   * [MDN Reference](https://mdn.io/StaticRange/endOffset)
   */
  get endOffset(): number {
    return this.#endOffset;
  }

  declare readonly [SymbolToStringTag]: "StaticRange";

  static {
    toStringTag("StaticRange")(this);
  }
}
