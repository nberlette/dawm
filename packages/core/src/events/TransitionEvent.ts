import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface TransitionEventInit extends EventInit {
  propertyName?: string;
  elapsedTime?: number;
  pseudoElement?: string;
}

declare module "dawm-internal" {
  export interface TransitionEventInternal {
    new: (type: string, eventInitDict?: TransitionEventInit) => TransitionEvent;
    getPropertyName(event: TransitionEvent): string;
    setPropertyName(
      event: TransitionEvent,
      propertyName: string,
    ): TransitionEvent;
    getElapsedTime(event: TransitionEvent): number;
    setElapsedTime(
      event: TransitionEvent,
      elapsedTime: number,
    ): TransitionEvent;
    getPseudoElement(event: TransitionEvent): string;
    setPseudoElement(
      event: TransitionEvent,
      pseudoElement: string,
    ): TransitionEvent;
  }

  export interface internal {
    TransitionEvent: TransitionEventInternal;
  }
}

const TRANSITION_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "propertyName",
  "elapsedTime",
  "pseudoElement",
] as const;

/**
 * Represents CSS transition lifecycle events.
 *
 * @example
 * ```ts
 * import { TransitionEvent } from "dawm/events";
 *
 * const event = new TransitionEvent("transitionend", {
 *   propertyName: "opacity",
 *   elapsedTime: 0.25,
 * });
 * event.propertyName; // "opacity"
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TransitionEvent
 */
export class TransitionEvent extends Event {
  #propertyName = "";
  #elapsedTime = 0;
  #pseudoElement = "";

  constructor(
    type: string,
    eventInitDict: TransitionEventInit = {
      __proto__: null,
    } as TransitionEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "TransitionEvent";

    this.#propertyName = eventInitDict.propertyName === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.propertyName);
    this.#elapsedTime = eventInitDict.elapsedTime === undefined
      ? 0
      : _.webidl.converters.float(eventInitDict.elapsedTime);
    this.#pseudoElement = eventInitDict.pseudoElement === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.pseudoElement);
  }

  get propertyName(): string {
    return this.#propertyName;
  }

  get elapsedTime(): number {
    return this.#elapsedTime;
  }

  get pseudoElement(): string {
    return this.#pseudoElement;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(TransitionEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(TransitionEventPrototype, this),
            keys: [...TRANSITION_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.TransitionEvent = {
      new: (type, eventInitDict) => new TransitionEvent(type, eventInitDict),
      getPropertyName: (event) => event.#propertyName,
      setPropertyName: (
        event,
        propertyName,
      ) => (event.#propertyName = propertyName, event),
      getElapsedTime: (event) => event.#elapsedTime,
      setElapsedTime: (
        event,
        elapsedTime,
      ) => (event.#elapsedTime = elapsedTime, event),
      getPseudoElement: (event) => event.#pseudoElement,
      setPseudoElement: (
        event,
        pseudoElement,
      ) => (event.#pseudoElement = pseudoElement, event),
    };
  }
}

const TransitionEventPrototype = _.webidl.createBranded(
  TransitionEvent.prototype,
);
