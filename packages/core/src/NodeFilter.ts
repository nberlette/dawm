// deno-lint-ignore-file no-var
import { ObjectFreeze } from "dawm-internal/primordials";
import type { numbers } from "dawm-internal/types";
import type { Node } from "./Node.ts";

export enum Filters {
  FILTER_ACCEPT = 1,
  FILTER_REJECT = 2,
  FILTER_SKIP = 3,
  SHOW_ALL = 0xFFFFFFFF,
  SHOW_ELEMENT = 0x1,
  SHOW_ATTRIBUTE = 0x2,
  SHOW_TEXT = 0x4,
  SHOW_CDATA_SECTION = 0x8,
  SHOW_ENTITY_REFERENCE = 0x10,
  SHOW_ENTITY = 0x20,
  SHOW_PROCESSING_INSTRUCTION = 0x40,
  SHOW_COMMENT = 0x80,
  SHOW_DOCUMENT = 0x100,
  SHOW_DOCUMENT_TYPE = 0x200,
  SHOW_DOCUMENT_FRAGMENT = 0x400,
  SHOW_NOTATION = 0x800,
}

ObjectFreeze(Filters);

export type FilterLike = Filters | numbers;

export interface NodeFilterFunction<
  TFilter extends FilterLike = FilterLike,
> {
  (node: Node): TFilter;
}

export interface NodeFilterMethod<
  TFilter extends FilterLike = FilterLike,
> {
  acceptNode(node: Node): TFilter;
}

export type NodeFilter = NodeFilterFunction | NodeFilterMethod;

export var NodeFilter: typeof Filters = ObjectFreeze(Filters);

export const acceptAllNodeFilter = {
  acceptNode: () => Filters.FILTER_ACCEPT as const,
} as const;

ObjectFreeze(acceptAllNodeFilter.acceptNode);
ObjectFreeze(acceptAllNodeFilter);
