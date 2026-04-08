import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface CloseEventInit extends EventInit {
  wasClean?: boolean;
  code?: number;
  reason?: string;
}

declare module "dawm-internal" {
  export interface CloseEventInternal {
    new: (type: string, eventInitDict?: CloseEventInit) => CloseEvent;
    getWasClean(event: CloseEvent): boolean;
    setWasClean(event: CloseEvent, wasClean: boolean): CloseEvent;
    getCode(event: CloseEvent): number;
    setCode(event: CloseEvent, code: number): CloseEvent;
    getReason(event: CloseEvent): string;
    setReason(event: CloseEvent, reason: string): CloseEvent;
  }

  export interface internal {
    CloseEvent: CloseEventInternal;
  }
}

const CLOSE_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "wasClean",
  "code",
  "reason",
] as const;

export class CloseEvent extends Event {
  #wasClean = false;
  #code = 0;
  #reason = "";

  constructor(
    type: string,
    eventInitDict: CloseEventInit = { __proto__: null } as CloseEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "CloseEvent";

    this.#wasClean = Boolean(eventInitDict.wasClean);
    this.#code = eventInitDict.code === undefined
      ? 0
      : _.webidl.converters["unsigned short"](eventInitDict.code);
    this.#reason = eventInitDict.reason === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.reason);
  }

  get wasClean(): boolean {
    return this.#wasClean;
  }

  get code(): number {
    return this.#code;
  }

  get reason(): string {
    return this.#reason;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(CloseEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(CloseEventPrototype, this),
            keys: [...CLOSE_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.CloseEvent = {
      new: (type, eventInitDict) => new CloseEvent(type, eventInitDict),
      getWasClean: (event) => event.#wasClean,
      setWasClean: (event, wasClean) => (event.#wasClean = wasClean, event),
      getCode: (event) => event.#code,
      setCode: (event, code) => (event.#code = code, event),
      getReason: (event) => event.#reason,
      setReason: (event, reason) => (event.#reason = reason, event),
    };
  }
}

const CloseEventPrototype = _.webidl.createBranded(CloseEvent.prototype);
