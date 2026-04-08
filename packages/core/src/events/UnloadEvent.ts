import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface UnloadEventInit extends EventInit {
}

declare module "dawm-internal" {
  export interface UnloadEventInternal {
    new: (type: string, eventInitDict?: UnloadEventInit) => UnloadEvent;
  }

  export interface internal {
    UnloadEvent: UnloadEventInternal;
  }
}

const UNLOAD_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
] as const;

export class UnloadEvent extends Event {
  constructor(
    type: string,
    eventInitDict: UnloadEventInit = { __proto__: null } as UnloadEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "UnloadEvent";
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(UnloadEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(UnloadEventPrototype, this),
            keys: [...UNLOAD_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.UnloadEvent = {
      new: (type, eventInitDict) => new UnloadEvent(type, eventInitDict),
    };
  }
}

const UnloadEventPrototype = _.webidl.createBranded(UnloadEvent.prototype);
