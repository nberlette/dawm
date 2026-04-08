import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { UIEvent, type UIEventInit } from "./UIEvent.ts";
import type { EventTarget } from "./EventTarget.ts";

export interface FocusEventInit extends UIEventInit {
  relatedTarget?: EventTarget | null;
}

declare module "dawm-internal" {
  export interface FocusEventInternal {
    new: (type: string, eventInitDict?: FocusEventInit) => FocusEvent;
    getRelatedTarget(event: FocusEvent): EventTarget | null;
    setRelatedTarget(
      event: FocusEvent,
      relatedTarget: EventTarget | null,
    ): FocusEvent;
  }

  export interface internal {
    FocusEvent: FocusEventInternal;
  }
}

const FOCUS_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "detail",
  "view",
  "relatedTarget",
] as const;

export class FocusEvent extends UIEvent {
  #relatedTarget: EventTarget | null = null;

  constructor(
    type: string,
    eventInitDict: FocusEventInit = { __proto__: null } as FocusEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "FocusEvent";

    this.#relatedTarget = eventInitDict.relatedTarget ?? null;
  }

  get relatedTarget(): EventTarget | null {
    return this.#relatedTarget;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(FocusEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(FocusEventPrototype, this),
            keys: [...FOCUS_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.FocusEvent = {
      new: (type, eventInitDict) => new FocusEvent(type, eventInitDict),
      getRelatedTarget: (event) => event.#relatedTarget,
      setRelatedTarget: (
        event,
        relatedTarget,
      ) => (event.#relatedTarget = relatedTarget, event),
    };
  }
}

const FocusEventPrototype = _.webidl.createBranded(FocusEvent.prototype);
