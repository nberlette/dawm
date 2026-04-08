import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import type { DataTransfer } from "./DataTransfer.ts";
import { Event, type EventInit } from "./Event.ts";

declare module "dawm-internal" {
  export interface ClipboardEventInternal {
    new: (type: string, eventInitDict?: ClipboardEventInit) => ClipboardEvent;
    getClipboardData(event: ClipboardEvent): DataTransfer | null;
    setClipboardData(
      event: ClipboardEvent,
      clipboardData: DataTransfer | null,
    ): ClipboardEvent;
  }

  export interface internal {
    ClipboardEvent: ClipboardEventInternal;
  }
}

export interface ClipboardEventInit extends EventInit {
  clipboardData?: DataTransfer | null;
}

const CLIPBOARD_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "clipboardData",
] as const;

export class ClipboardEvent extends Event {
  #clipboardData: DataTransfer | null = null;

  constructor(
    type: string,
    eventInitDict: ClipboardEventInit = {
      __proto__: null,
    } as ClipboardEventInit,
  ) {
    super(type, eventInitDict);
    this[SymbolToStringTag] = "ClipboardEvent";
    this.#clipboardData = eventInitDict.clipboardData ?? null;
  }

  get clipboardData(): DataTransfer | null {
    return this.#clipboardData;
  }

  declare readonly [SymbolToStringTag]: "ClipboardEvent";

  static {
    ObjectDefineProperty(ClipboardEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(ClipboardEventPrototype, this),
            keys: [...CLIPBOARD_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.ClipboardEvent = {
      new: (type, eventInitDict) => new ClipboardEvent(type, eventInitDict),
      getClipboardData: (event) => event.#clipboardData,
      setClipboardData: (
        event,
        clipboardData,
      ) => (event.#clipboardData = clipboardData, event),
    };
  }
}

const ClipboardEventPrototype = _.webidl.createBranded(
  ClipboardEvent.prototype,
);
