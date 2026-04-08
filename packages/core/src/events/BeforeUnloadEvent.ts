import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface BeforeUnloadEventInit extends EventInit {
  returnValue?: string;
}

declare module "dawm-internal" {
  export interface BeforeUnloadEventInternal {
    new: (
      type: string,
      eventInitDict?: BeforeUnloadEventInit,
    ) => BeforeUnloadEvent;
    getLegacyReturnValue(event: BeforeUnloadEvent): string;
    setLegacyReturnValue(
      event: BeforeUnloadEvent,
      returnValue: string,
    ): BeforeUnloadEvent;
  }

  export interface internal {
    BeforeUnloadEvent: BeforeUnloadEventInternal;
  }
}

const BEFORE_UNLOAD_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "returnValue",
] as const;

export class BeforeUnloadEvent extends Event {
  #legacyReturnValue = "";

  constructor(
    type: string,
    eventInitDict: BeforeUnloadEventInit = {
      __proto__: null,
    } as BeforeUnloadEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "BeforeUnloadEvent";

    if (eventInitDict.returnValue !== undefined) {
      this.returnValue = eventInitDict.returnValue;
    }
  }

  override get returnValue(): any {
    return this.#legacyReturnValue;
  }

  override set returnValue(value: any) {
    const str = _.webidl.converters.DOMString(value);
    this.#legacyReturnValue = str;
    _.Event.setCanceledFlag(this, str !== "");
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(BeforeUnloadEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(BeforeUnloadEventPrototype, this),
            keys: [...BEFORE_UNLOAD_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.BeforeUnloadEvent = {
      new: (type, eventInitDict) => new BeforeUnloadEvent(type, eventInitDict),
      getLegacyReturnValue: (event) => event.#legacyReturnValue,
      setLegacyReturnValue: (
        event,
        returnValue,
      ) => (event.returnValue = returnValue, event),
    };
  }
}

const BeforeUnloadEventPrototype = _.webidl.createBranded(
  BeforeUnloadEvent.prototype,
);
