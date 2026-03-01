import type { Node } from "./Node.ts";
import { internal as _ } from "../internal/api.ts";
import { ObjectDefineProperties } from "../internal/primordials.ts";

/** [MDN Reference](https://mdn.io/AbstractRange) */
export abstract class AbstractRange {
  /**
   * Returns `true` if the range's start and end positions are the same, and
   * `false` otherwise.
   *
   * [MDN Reference](https://mdn.io/AbstractRange/collapsed)
   */
  declare readonly collapsed: boolean;

  /**
   * Returns range's end node.
   *
   * [MDN Reference](https://mdn.io/AbstractRange/endContainer)
   */
  abstract readonly endContainer: Node;

  /**
   * Returns range's end offset.
   *
   * [MDN Reference](https://mdn.io/AbstractRange/endOffset)
   */
  abstract readonly endOffset: number;

  /**
   * Returns range's start node.
   *
   * [MDN Reference](https://mdn.io/AbstractRange/startContainer)
   */
  abstract readonly startContainer: Node;

  /**
   * Returns range's start offset.
   *
   * [MDN Reference](https://mdn.io/AbstractRange/startOffset)
   */
  abstract readonly startOffset: number;

  static {
    ObjectDefineProperties(
      this.prototype,
      {
        collapsed: {
          enumerable: true,
          configurable: true,
          get() {
            const a = this.startContainer, b = this.endContainer;
            return a.isSameNode(b) && this.startOffset === this.endOffset;
          },
          set() {},
        },
      } as PropertyDescriptorMap & ThisType<AbstractRange>,
    );
  }
}
