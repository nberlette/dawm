import _ from "../_internal.ts";
import { ObjectFreeze } from "../internal/primordials.ts";

export * from "../_internal.ts";

/**
 * Creates a readonly `PropertyDescriptor` object that is ready to be passed to
 * the `Object.defineProperty` or `Reflect.defineProperty` method. The returned
 * descriptor's `writable` attribute will always be `false`; however, both its
 * `enumerable` and `configurable` attributes can be set via their respective
 * (optional) positional arguments, otherwise they both default to `true`.
 *
 * @param value Becomes the `value` property of the returned descriptor.
 * @param [enumerable=true] Whether the property should be visible as a public
 * "enumerable" field when traversing the object. Setting this to false will
 * exclude the property from operations like `Object.keys` and `for-in` loops.
 * Defaults to `true`.
 * @param [configurable=true] Whether the property will allow itself to be
 * re-declared/overwritten by future calls to `defineProperty` on the `Object`
 * or `Reflect` native APIs. Defaults to `true`.
 * @returns a readonly PropertyDescriptor with the given value and attributes.
 * @internal
 */
export const readonly = <T>(
  value: T,
  enumerable = true,
  configurable = false,
) => ({ value, writable: false, enumerable, configurable });
_.define("readonly", readonly);

export const NODE_CONSTANTS_MIXIN = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12,
  DOCUMENT_POSITION_DISCONNECTED: 1,
  DOCUMENT_POSITION_PRECEDING: 2,
  DOCUMENT_POSITION_FOLLOWING: 4,
  DOCUMENT_POSITION_CONTAINS: 8,
  DOCUMENT_POSITION_CONTAINED_BY: 16,
  DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32,
} as const;
ObjectFreeze(NODE_CONSTANTS_MIXIN);
