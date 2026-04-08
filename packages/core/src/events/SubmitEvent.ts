import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";
import type { HTMLElement } from "dawm-html/html-element";

export interface SubmitEventInit extends EventInit {
  submitter?: HTMLElement | null;
}

declare module "dawm-internal" {
  export interface SubmitEventInternal {
    new: (type: string, eventInitDict?: SubmitEventInit) => SubmitEvent;
    getSubmitter(event: SubmitEvent): HTMLElement | null;
    setSubmitter(
      event: SubmitEvent,
      submitter: HTMLElement | null,
    ): SubmitEvent;
  }

  export interface internal {
    SubmitEvent: SubmitEventInternal;
  }
}

const SUBMIT_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "submitter",
] as const;

/**
 * Represents form submit lifecycle events.
 *
 * @example
 * ```ts
 * import { SubmitEvent } from "dawm/events";
 *
 * const event = new SubmitEvent("submit");
 * event.type; // "submit"
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent
 */
export class SubmitEvent extends Event {
  #submitter: HTMLElement | null = null;

  constructor(
    type: string,
    eventInitDict: SubmitEventInit = { __proto__: null } as SubmitEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "SubmitEvent";

    this.#submitter = eventInitDict.submitter ?? null;
  }

  get submitter(): HTMLElement | null {
    return this.#submitter;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(SubmitEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(SubmitEventPrototype, this),
            keys: [...SUBMIT_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.SubmitEvent = {
      new: (type, eventInitDict) => new SubmitEvent(type, eventInitDict),
      getSubmitter: (event) => event.#submitter,
      setSubmitter: (event, submitter) => (event.#submitter = submitter, event),
    };
  }
}

const SubmitEventPrototype = _.webidl.createBranded(SubmitEvent.prototype);
