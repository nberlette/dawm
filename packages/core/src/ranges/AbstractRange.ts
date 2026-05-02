import { Node } from "../Node.ts";
import { _, ObjectDefineProperties } from "dawm-internal";

declare module "dawm-webidl/converters" {
  export interface Converters {
    "AbstractRange": Converter<AbstractRange>;
    "sequence<AbstractRange>": Converter<AbstractRange[]>;
  }
}
_.webidl.converters.AbstractRange = _.webidl.convert.dictionary(
  [
    {
      key: "startContainer",
      converter: _.webidl.converters.Node,
      required: true,
    },
    {
      key: "startOffset",
      converter: _.webidl.converters["unsigned long"],
      required: true,
    },
    {
      key: "endContainer",
      converter: _.webidl.converters.Node,
      required: true,
    },
    {
      key: "endOffset",
      converter: _.webidl.converters["unsigned long"],
      required: true,
    },
    {
      key: "collapsed",
      converter: _.webidl.converters.boolean,
      required: true,
    },
  ],
  { name: "AbstractRange" },
);

_.webidl.converters["sequence<AbstractRange>"] = _.webidl.convert.sequence(
  _.webidl.converters.AbstractRange,
);

/**
 * The `AbstractRange` interface represents a fragment of a document that can
 * contain nodes and parts of text nodes.
 *
 * This is an abstract base class inherited by the {@linkcode Range} and
 * {@linkcode StaticRange} interfaces, which provide concrete implementations
 * of ranges that can be manipulated and used for various purposes.
 *
 * Common use cases for ranges include selecting/manipulating specific portions
 * of a document, implementing features like drag-and-drop, and performing
 * complex DOM manipulations requiring precise control over a document tree.
 *
 * [MDN Reference](https://mdn.io/AbstractRange)
 */
export abstract class AbstractRange {
  constructor() {
    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: AbstractRange,
      abstract: true,
    });
  }

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
