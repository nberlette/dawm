import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import type { EventTarget } from "./EventTarget.ts";
import { UIEvent, type UIEventInit } from "./UIEvent.ts";

export interface Touch {
  readonly identifier: number;
  readonly target: EventTarget;
  readonly clientX: number;
  readonly clientY: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly pageX: number;
  readonly pageY: number;
}

export interface TouchEventInit extends UIEventInit {
  touches?: Iterable<Touch> | ArrayLike<Touch>;
  targetTouches?: Iterable<Touch> | ArrayLike<Touch>;
  changedTouches?: Iterable<Touch> | ArrayLike<Touch>;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

declare module "dawm-internal" {
  export interface TouchEventInternal {
    new: (type: string, eventInitDict?: TouchEventInit) => TouchEvent;
    setTouches(event: TouchEvent, touches: readonly Touch[]): TouchEvent;
    setTargetTouches(
      event: TouchEvent,
      targetTouches: readonly Touch[],
    ): TouchEvent;
    setChangedTouches(
      event: TouchEvent,
      changedTouches: readonly Touch[],
    ): TouchEvent;
    setCtrlKey(event: TouchEvent, ctrlKey: boolean): TouchEvent;
    setShiftKey(event: TouchEvent, shiftKey: boolean): TouchEvent;
    setAltKey(event: TouchEvent, altKey: boolean): TouchEvent;
    setMetaKey(event: TouchEvent, metaKey: boolean): TouchEvent;
  }

  export interface internal {
    TouchEvent: TouchEventInternal;
  }
}

const TOUCH_EVENT_PROPS = [
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
  "touches",
  "targetTouches",
  "changedTouches",
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
] as const;

function toTouchArray(value: unknown): Touch[] {
  if (value == null) {
    return [];
  }

  if (typeof (value as Iterable<Touch>)[Symbol.iterator] === "function") {
    return [...(value as Iterable<Touch>)];
  }

  const arrayLike = value as ArrayLike<Touch>;
  if (typeof arrayLike.length === "number") {
    const out: Touch[] = [];
    for (let i = 0; i < arrayLike.length; i++) {
      out.push(arrayLike[i]);
    }
    return out;
  }

  return [];
}

export class TouchEvent extends UIEvent {
  #touches: readonly Touch[] = [];
  #targetTouches: readonly Touch[] = [];
  #changedTouches: readonly Touch[] = [];
  #ctrlKey = false;
  #shiftKey = false;
  #altKey = false;
  #metaKey = false;

  constructor(
    type: string,
    eventInitDict: TouchEventInit = { __proto__: null } as TouchEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "TouchEvent";

    this.#touches = toTouchArray(eventInitDict.touches);
    this.#targetTouches = toTouchArray(eventInitDict.targetTouches);
    this.#changedTouches = toTouchArray(eventInitDict.changedTouches);
    this.#ctrlKey = Boolean(eventInitDict.ctrlKey);
    this.#shiftKey = Boolean(eventInitDict.shiftKey);
    this.#altKey = Boolean(eventInitDict.altKey);
    this.#metaKey = Boolean(eventInitDict.metaKey);
  }

  get touches(): readonly Touch[] {
    return this.#touches;
  }

  get targetTouches(): readonly Touch[] {
    return this.#targetTouches;
  }

  get changedTouches(): readonly Touch[] {
    return this.#changedTouches;
  }

  get ctrlKey(): boolean {
    return this.#ctrlKey;
  }

  get shiftKey(): boolean {
    return this.#shiftKey;
  }

  get altKey(): boolean {
    return this.#altKey;
  }

  get metaKey(): boolean {
    return this.#metaKey;
  }

  getModifierState(keyArg: string): boolean {
    keyArg = _.webidl.converters.DOMString(
      keyArg,
      "Failed to execute 'getModifierState' on 'TouchEvent'",
      "Argument 1",
    );

    switch (keyArg) {
      case "Alt":
      case "AltGraph":
        return this.#altKey;
      case "Control":
      case "Ctrl":
        return this.#ctrlKey;
      case "Meta":
      case "OS":
      case "Super":
        return this.#metaKey;
      case "Shift":
        return this.#shiftKey;
      default:
        return false;
    }
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(TouchEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(TouchEventPrototype, this),
            keys: [...TOUCH_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.TouchEvent = {
      new: (type, eventInitDict) => new TouchEvent(type, eventInitDict),
      setTouches: (event, touches) => (event.#touches = [...touches], event),
      setTargetTouches: (
        event,
        targetTouches,
      ) => (event.#targetTouches = [...targetTouches], event),
      setChangedTouches: (
        event,
        changedTouches,
      ) => (event.#changedTouches = [...changedTouches], event),
      setCtrlKey: (event, ctrlKey) => (event.#ctrlKey = ctrlKey, event),
      setShiftKey: (event, shiftKey) => (event.#shiftKey = shiftKey, event),
      setAltKey: (event, altKey) => (event.#altKey = altKey, event),
      setMetaKey: (event, metaKey) => (event.#metaKey = metaKey, event),
    };
  }
}

const TouchEventPrototype = _.webidl.createBranded(TouchEvent.prototype);
