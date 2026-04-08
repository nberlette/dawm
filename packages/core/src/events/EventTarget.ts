/**
 * # `EventTarget`
 *
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)
 *
 * [DOM Standard]: https://dom.spec.whatwg.org/#interface-eventtarget
 *
 * @module EventTarget
 */

import {
  _,
  ArrayPrototypePush,
  ArrayPrototypeSplice,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event } from "./Event.ts";
import {
  addEventListenerOptionsConverter,
  dispatch,
  type EventTargetData,
  eventTargetData,
  type EventTargetWithData,
  getDefaultTargetData,
  getListeners,
  kResistStopImmediatePropagation,
  listenerCount,
  normalizeEventHandlerOptions,
  setEventTargetData,
} from "./_common.ts";
import { DOMException } from "dawm-core/dom-exception";
import {
  AddEventListenerOptions,
  EventListenerOrEventListenerObject,
} from "./types.ts";

declare module "dawm-internal" {
  export interface EventTargetInternal {
    new: () => EventTarget;

    readonly eventTargetData: typeof eventTargetData;
    readonly kResistStopImmediatePropagation:
      typeof kResistStopImmediatePropagation;

    getDefaultTargetData(): EventTargetData;
    setEventTargetData(target: EventTarget): EventTarget;
    listenerCount(target: EventTarget, type: string): number;
    dispatch(
      target: EventTarget,
      event: Event,
      targetOverride?: EventTarget,
    ): boolean;
  }

  export interface internal {
    EventTarget: EventTargetInternal;
  }
}

export abstract class EventTarget {
  constructor() {
    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: EventTarget,
      abstract: true,
    });
    _.webidl.createBranded(this);
    setEventTargetData(this);
  }

  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const self = this as {} as EventTargetWithData;
    _.webidl.assertBranded(self, EventTargetPrototype);

    const prefix = "Failed to execute 'addEventListener' on 'EventTarget'";
    _.webidl.requiredArguments(arguments.length, 2, prefix);

    type = _.webidl.converters.DOMString(type, prefix, "Argument 1");
    const normalized = addEventListenerOptionsConverter(options);

    if (callback === null) return;

    const listeners = getListeners(self);
    if (!listeners[type]) listeners[type] = [];

    const listenerList = listeners[type];
    for (let i = 0; i < listenerList.length; ++i) {
      const listener = listenerList[i];
      if (
        listener.options.capture === normalized.capture &&
        listener.callback === callback
      ) return;
    }

    const signal = normalized.signal;
    if (signal) {
      if (signal.aborted) return;
      signal.addEventListener("abort", () => {
        self.removeEventListener(type, callback, normalized);
      }, { once: true });
    }

    ArrayPrototypePush(listeners[type], { callback, options: normalized });
  }

  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    const self = this as {} as EventTargetWithData;
    _.webidl.assertBranded(self, EventTargetPrototype);

    const prefix = "Failed to execute 'removeEventListener' on 'EventTarget'";
    _.webidl.requiredArguments(arguments.length, 2, prefix);

    type = _.webidl.converters.DOMString(type, prefix, "Argument 1");

    const listeners = getListeners(self);
    if (callback === null || !listeners[type]) return;

    const normalized = normalizeEventHandlerOptions(options);
    for (let i = 0; i < listeners[type].length; ++i) {
      const listener = listeners[type][i];
      if (
        listener.options.capture === normalized.capture &&
        listener.callback === callback
      ) {
        ArrayPrototypeSplice(listeners[type], i, 1);
        break;
      }
    }
  }

  /**
   * Dispatches an event to this `EventTarget`, invoking the affected event
   * listeners in the appropriate order. Returns `false` if any of the events
   * were cancelable and at least one handler called `Event.preventDefault()`.
   * Otherwise, returns `true`.
   *
   * @throws {TypeError} If the argument is not an `Event` object.
   */
  dispatchEvent(event: Event): boolean {
    const self = this as {} as EventTargetWithData;
    _.webidl.assertBranded(self, EventTargetPrototype);
    _.webidl.requiredArguments(
      arguments.length,
      1,
      "Failed to execute 'dispatchEvent' on 'EventTarget'",
    );

    event = _.webidl.converters.Event(event, {
      prefix: "Failed to execute 'dispatchEvent' on 'EventTarget'",
      context: "Argument 1",
      type: "Event",
    });

    if (_.Event.getDispatched(event)) {
      throw new DOMException("Invalid event state", "InvalidStateError");
    }

    if (event.eventPhase !== Event.NONE) {
      throw new DOMException("Invalid event state", "InvalidStateError");
    }

    return dispatch(self, event);
  }

  /**
   * @deprecated This method is no longer part of the standard and should not
   * be used in new code. It may be removed in a future release. It is here for
   * historical/compatibility reasons only, and it always returns `null`.
   */
  getParent?(_event: Event): EventTarget | null {
    return null;
  }

  static {
    ObjectDefineProperty(this.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (
          value: unknown,
          inspectOptions: Record<string, unknown>,
        ) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return `${this.constructor.name} ${inspect({}, inspectOptions)}`;
      },
      configurable: true,
    } as PropertyDescriptor);

    _.EventTarget = {
      new: () => new (EventTarget as any)(_.keys._private),
      eventTargetData,
      kResistStopImmediatePropagation,
      getDefaultTargetData,
      setEventTargetData,
      listenerCount,
      dispatch,
    };
  }
}

const EventTargetPrototype = _.webidl.createBranded(EventTarget.prototype);
