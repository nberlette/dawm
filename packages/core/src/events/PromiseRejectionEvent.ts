import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface PromiseRejectionEventInit extends EventInit {
  promise?: Promise<unknown>;
  reason?: unknown;
}

declare module "dawm-internal" {
  export interface PromiseRejectionEventInternal {
    new: (
      type: string,
      eventInitDict?: PromiseRejectionEventInit,
    ) => PromiseRejectionEvent;
    getPromise(event: PromiseRejectionEvent): Promise<unknown> | null;
    setPromise(
      event: PromiseRejectionEvent,
      promise: Promise<unknown> | null,
    ): PromiseRejectionEvent;
    getReason(event: PromiseRejectionEvent): unknown;
    setReason(
      event: PromiseRejectionEvent,
      reason: unknown,
    ): PromiseRejectionEvent;
  }

  export interface internal {
    PromiseRejectionEvent: PromiseRejectionEventInternal;
  }
}

const PROMISE_REJECTION_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "promise",
  "reason",
] as const;

export class PromiseRejectionEvent extends Event {
  #promise: Promise<unknown> | null = null;
  #reason: unknown = null;

  constructor(
    type: string,
    eventInitDict: PromiseRejectionEventInit = {
      __proto__: null,
    } as PromiseRejectionEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "PromiseRejectionEvent";

    this.#promise = eventInitDict.promise ?? null;
    this.#reason = eventInitDict.reason;
  }

  get promise(): Promise<unknown> | null {
    return this.#promise;
  }

  get reason(): unknown {
    return this.#reason;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(PromiseRejectionEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(
              PromiseRejectionEventPrototype,
              this,
            ),
            keys: [...PROMISE_REJECTION_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.PromiseRejectionEvent = {
      new: (type, eventInitDict) =>
        new PromiseRejectionEvent(type, eventInitDict),
      getPromise: (event) => event.#promise,
      setPromise: (event, promise) => (event.#promise = promise, event),
      getReason: (event) => event.#reason,
      setReason: (event, reason) => (event.#reason = reason, event),
    };
  }
}

const PromiseRejectionEventPrototype = _.webidl.createBranded(
  PromiseRejectionEvent.prototype,
);
