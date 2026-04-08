import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { UIEvent, type UIEventInit } from "./UIEvent.ts";
import type { EventTarget } from "./EventTarget.ts";

export interface MouseEventInit extends UIEventInit {
  screenX?: number;
  screenY?: number;
  clientX?: number;
  clientY?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  button?: number;
  buttons?: number;
  relatedTarget?: EventTarget | null;
  movementX?: number;
  movementY?: number;
}

declare module "dawm-internal" {
  export interface MouseEventInternal {
    new: (type: string, eventInitDict?: MouseEventInit) => MouseEvent;
    setRelatedTarget(
      event: MouseEvent,
      relatedTarget: EventTarget | null,
    ): MouseEvent;
  }

  export interface internal {
    MouseEvent: MouseEventInternal;
  }
}

const MOUSE_EVENT_PROPS = [
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
  "screenX",
  "screenY",
  "clientX",
  "clientY",
  "x",
  "y",
  "movementX",
  "movementY",
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
  "button",
  "buttons",
  "relatedTarget",
  "which",
] as const;

function buttonToWhich(button: number): number {
  switch (button) {
    case 0:
      return 1;
    case 1:
      return 2;
    case 2:
      return 3;
    default:
      return 0;
  }
}

export class MouseEvent extends UIEvent {
  #screenX = 0;
  #screenY = 0;
  #clientX = 0;
  #clientY = 0;
  #ctrlKey = false;
  #shiftKey = false;
  #altKey = false;
  #metaKey = false;
  #button = 0;
  #buttons = 0;
  #relatedTarget: EventTarget | null = null;
  #movementX = 0;
  #movementY = 0;

  constructor(
    type: string,
    eventInitDict: MouseEventInit = { __proto__: null } as MouseEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "MouseEvent";

    this.#screenX = eventInitDict.screenX === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.screenX);
    this.#screenY = eventInitDict.screenY === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.screenY);
    this.#clientX = eventInitDict.clientX === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.clientX);
    this.#clientY = eventInitDict.clientY === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.clientY);
    this.#ctrlKey = Boolean(eventInitDict.ctrlKey);
    this.#shiftKey = Boolean(eventInitDict.shiftKey);
    this.#altKey = Boolean(eventInitDict.altKey);
    this.#metaKey = Boolean(eventInitDict.metaKey);
    this.#button = eventInitDict.button === undefined
      ? 0
      : _.webidl.converters.short(eventInitDict.button);
    this.#buttons = eventInitDict.buttons === undefined
      ? 0
      : _.webidl.converters["unsigned short"](eventInitDict.buttons);
    this.#relatedTarget = eventInitDict.relatedTarget ?? null;
    this.#movementX = eventInitDict.movementX === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.movementX);
    this.#movementY = eventInitDict.movementY === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.movementY);
  }

  get screenX(): number {
    return this.#screenX;
  }

  get screenY(): number {
    return this.#screenY;
  }

  get clientX(): number {
    return this.#clientX;
  }

  get clientY(): number {
    return this.#clientY;
  }

  get x(): number {
    return this.#clientX;
  }

  get y(): number {
    return this.#clientY;
  }

  get movementX(): number {
    return this.#movementX;
  }

  get movementY(): number {
    return this.#movementY;
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

  get button(): number {
    return this.#button;
  }

  get buttons(): number {
    return this.#buttons;
  }

  get relatedTarget(): EventTarget | null {
    return this.#relatedTarget;
  }

  override get which(): number {
    return buttonToWhich(this.#button);
  }

  getModifierState(keyArg: string): boolean {
    keyArg = _.webidl.converters.DOMString(
      keyArg,
      "Failed to execute 'getModifierState' on 'MouseEvent'",
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

  initMouseEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    view: UIEventInit["view"] = null,
    detail = 0,
    screenX = 0,
    screenY = 0,
    clientX = 0,
    clientY = 0,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
    button = 0,
    relatedTarget: EventTarget | null = null,
  ): void {
    _.webidl.requiredArguments(
      arguments.length,
      1,
      "Failed to execute 'initMouseEvent' on 'MouseEvent'",
    );

    if (_.Event.getDispatched(this)) {
      return;
    }

    this.initUIEvent(type, bubbles, cancelable, view ?? null, detail);

    this.#screenX = _.webidl.converters.long(screenX);
    this.#screenY = _.webidl.converters.long(screenY);
    this.#clientX = _.webidl.converters.long(clientX);
    this.#clientY = _.webidl.converters.long(clientY);
    this.#ctrlKey = Boolean(ctrlKey);
    this.#altKey = Boolean(altKey);
    this.#shiftKey = Boolean(shiftKey);
    this.#metaKey = Boolean(metaKey);
    this.#button = _.webidl.converters.short(button);
    this.#relatedTarget = relatedTarget;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(MouseEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(MouseEventPrototype, this),
            keys: [...MOUSE_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.MouseEvent = {
      new: (type, eventInitDict) => new MouseEvent(type, eventInitDict),
      setRelatedTarget: (
        event,
        relatedTarget,
      ) => (event.#relatedTarget = relatedTarget, event),
    };
  }
}

const MouseEventPrototype = _.webidl.createBranded(MouseEvent.prototype);
