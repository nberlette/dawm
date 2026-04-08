import { internal as _ } from "dawm-internal";
import { SymbolToStringTag } from "dawm-internal/primordials";
import { Event } from "dawm-core/events/event";
import type { EventTarget } from "dawm-core/events/event-target";

export const _attributes: unique symbol = Symbol("[[attributes]]");
export const _canceledFlag: unique symbol = Symbol("[[canceledFlag]]");
export const _stopPropagationFlag: unique symbol = Symbol(
  "[[stopPropagationFlag]]",
);
export const _stopImmediatePropagationFlag: unique symbol = Symbol(
  "[[stopImmediatePropagationFlag]]",
);
export const _inPassiveListener: unique symbol = Symbol(
  "[[inPassiveListener]]",
);
export const _dispatched: unique symbol = Symbol("[[dispatched]]");
export const _isTrusted: unique symbol = Symbol("[[isTrusted]]");
export const _path: unique symbol = Symbol("[[path]]");
export interface EventAttributes {
  type: string;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  eventPhase: number;
  bubbles: boolean;
  cancelable: boolean;
  composed: boolean;
  timeStamp: number;
}
export interface EventPathEntry {
  item: EventTarget;
  itemInShadowTree: boolean;
  relatedTarget: EventTarget | null;
  rootOfClosedTree: boolean;
  slotInClosedTree: boolean;
  target: EventTarget | null;
  touchTargetList: EventTarget[];
}
export interface EventInternals extends Event {
  [SymbolToStringTag]: string;
  [_attributes]: EventAttributes;
  [_canceledFlag]: boolean;
  [_stopPropagationFlag]: boolean;
  [_stopImmediatePropagationFlag]: boolean;
  [_inPassiveListener]: boolean;
  [_dispatched]: boolean;
  [_isTrusted]: boolean;
  [_path]: EventPathEntry[];
  [_.webidl.brand]: typeof _.webidl.brand;
}
export function asEventInternals(event: Event): EventInternals {
  return event as EventInternals;
}
