// deno-lint-ignore-file no-var
import { ObjectFreeze } from "../internal/primordials.ts";
import type { numbers } from "../internal/types.ts";
import type { Node } from "./Node.ts";

export interface NodeFilterFunction {
  (node: Node): NodeFilterFlags | numbers;
}

export interface NodeFilterObject {
  acceptNode(node: Node): NodeFilterFlags | numbers;
}

export type NodeFilter = NodeFilterFunction | NodeFilterObject;

export enum NodeFilterFlags {
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

export interface NodeFilterValues {
  readonly FILTER_ACCEPT: 1;
  readonly FILTER_REJECT: 2;
  readonly FILTER_SKIP: 3;
  readonly SHOW_ALL: 0xFFFFFFFF;
  readonly SHOW_ELEMENT: 0x1;
  readonly SHOW_ATTRIBUTE: 0x2;
  readonly SHOW_TEXT: 0x4;
  readonly SHOW_CDATA_SECTION: 0x8;
  readonly SHOW_ENTITY_REFERENCE: 0x10;
  readonly SHOW_ENTITY: 0x20;
  readonly SHOW_PROCESSING_INSTRUCTION: 0x40;
  readonly SHOW_COMMENT: 0x80;
  readonly SHOW_DOCUMENT: 0x100;
  readonly SHOW_DOCUMENT_TYPE: 0x200;
  readonly SHOW_DOCUMENT_FRAGMENT: 0x400;
  readonly SHOW_NOTATION: 0x800;
}

export var NodeFilter: typeof NodeFilterFlags = ObjectFreeze(NodeFilterFlags);

export type NodeFilterType = NodeFilterFlags;
