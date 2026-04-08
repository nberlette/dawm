import {
  _,
  defineConstants,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { UIEvent, type UIEventInit } from "./UIEvent.ts";

export interface KeyboardEventInit extends UIEventInit {
  key?: string;
  code?: string;
  location?: number;
  repeat?: boolean;
  isComposing?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  charCode?: number;
  keyCode?: number;
  which?: number;
}

declare module "dawm-internal" {
  export interface KeyboardEventInternal {
    new: (type: string, eventInitDict?: KeyboardEventInit) => KeyboardEvent;
    setKey(event: KeyboardEvent, key: string): KeyboardEvent;
    setCode(event: KeyboardEvent, code: string): KeyboardEvent;
    setLocation(event: KeyboardEvent, location: number): KeyboardEvent;
    setRepeat(event: KeyboardEvent, repeat: boolean): KeyboardEvent;
    setIsComposing(event: KeyboardEvent, isComposing: boolean): KeyboardEvent;
    setCtrlKey(event: KeyboardEvent, ctrlKey: boolean): KeyboardEvent;
    setShiftKey(event: KeyboardEvent, shiftKey: boolean): KeyboardEvent;
    setAltKey(event: KeyboardEvent, altKey: boolean): KeyboardEvent;
    setMetaKey(event: KeyboardEvent, metaKey: boolean): KeyboardEvent;
    setCharCode(event: KeyboardEvent, charCode: number): KeyboardEvent;
    setKeyCode(event: KeyboardEvent, keyCode: number): KeyboardEvent;
    setWhich(event: KeyboardEvent, which: number): KeyboardEvent;
  }

  export interface internal {
    KeyboardEvent: KeyboardEventInternal;
  }
}

const KEYBOARD_EVENT_PROPS = [
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
  "key",
  "code",
  "location",
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
  "repeat",
  "isComposing",
  "charCode",
  "keyCode",
  "which",
] as const;

export class KeyboardEvent extends UIEvent {
  static readonly DOM_KEY_LOCATION_STANDARD = 0 as const;
  static readonly DOM_KEY_LOCATION_LEFT = 1 as const;
  static readonly DOM_KEY_LOCATION_RIGHT = 2 as const;
  static readonly DOM_KEY_LOCATION_NUMPAD = 3 as const;

  #key = "";
  #code = "";
  #location: number = KeyboardEvent.DOM_KEY_LOCATION_STANDARD;
  #ctrlKey = false;
  #shiftKey = false;
  #altKey = false;
  #metaKey = false;
  #repeat = false;
  #isComposing = false;
  #charCode = 0;
  #keyCode = 0;
  #which = 0;

  constructor(
    type: string,
    eventInitDict: KeyboardEventInit = { __proto__: null } as KeyboardEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "KeyboardEvent";

    this.#key = eventInitDict.key === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.key);
    this.#code = eventInitDict.code === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.code);
    this.#location = eventInitDict.location === undefined
      ? KeyboardEvent.DOM_KEY_LOCATION_STANDARD
      : _.webidl.converters["unsigned long"](eventInitDict.location);
    this.#ctrlKey = Boolean(eventInitDict.ctrlKey);
    this.#shiftKey = Boolean(eventInitDict.shiftKey);
    this.#altKey = Boolean(eventInitDict.altKey);
    this.#metaKey = Boolean(eventInitDict.metaKey);
    this.#repeat = Boolean(eventInitDict.repeat);
    this.#isComposing = Boolean(eventInitDict.isComposing);
    this.#charCode = eventInitDict.charCode === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.charCode);
    this.#keyCode = eventInitDict.keyCode === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.keyCode);
    this.#which = eventInitDict.which === undefined
      ? this.#keyCode
      : _.webidl.converters["unsigned long"](eventInitDict.which);
  }

  get key(): string {
    return this.#key;
  }

  get code(): string {
    return this.#code;
  }

  get location(): number {
    return this.#location;
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

  get repeat(): boolean {
    return this.#repeat;
  }

  get isComposing(): boolean {
    return this.#isComposing;
  }

  get charCode(): number {
    return this.#charCode;
  }

  get keyCode(): number {
    return this.#keyCode;
  }

  override get which(): number {
    return this.#which;
  }

  getModifierState(keyArg: string): boolean {
    keyArg = _.webidl.converters.DOMString(
      keyArg,
      "Failed to execute 'getModifierState' on 'KeyboardEvent'",
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

  initKeyboardEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    view: UIEventInit["view"] = null,
    key = "",
    location = KeyboardEvent.DOM_KEY_LOCATION_STANDARD,
    ctrlKey = false,
    altKey = false,
    shiftKey = false,
    metaKey = false,
  ): void {
    _.webidl.requiredArguments(
      arguments.length,
      1,
      "Failed to execute 'initKeyboardEvent' on 'KeyboardEvent'",
    );

    if (_.Event.getDispatched(this)) {
      return;
    }

    this.initUIEvent(type, bubbles, cancelable, view ?? null, 0);

    this.#key = _.webidl.converters.DOMString(key);
    this.#location = _.webidl.converters["unsigned long"](location);
    this.#ctrlKey = Boolean(ctrlKey);
    this.#altKey = Boolean(altKey);
    this.#shiftKey = Boolean(shiftKey);
    this.#metaKey = Boolean(metaKey);
  }

  declare readonly [SymbolToStringTag]: string;

  declare readonly DOM_KEY_LOCATION_STANDARD: 0;
  declare readonly DOM_KEY_LOCATION_LEFT: 1;
  declare readonly DOM_KEY_LOCATION_RIGHT: 2;
  declare readonly DOM_KEY_LOCATION_NUMPAD: 3;

  static {
    defineConstants(
      KeyboardEvent,
      ["DOM_KEY_LOCATION_STANDARD", 0],
      ["DOM_KEY_LOCATION_LEFT", 1],
      ["DOM_KEY_LOCATION_RIGHT", 2],
      ["DOM_KEY_LOCATION_NUMPAD", 3],
    );
  }

  static {
    ObjectDefineProperty(KeyboardEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(KeyboardEventPrototype, this),
            keys: [...KEYBOARD_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.KeyboardEvent = {
      new: (type, eventInitDict) => new KeyboardEvent(type, eventInitDict),
      setKey: (event, key) => (event.#key = key, event),
      setCode: (event, code) => (event.#code = code, event),
      setLocation: (event, location) => (event.#location = location, event),
      setRepeat: (event, repeat) => (event.#repeat = repeat, event),
      setIsComposing: (
        event,
        isComposing,
      ) => (event.#isComposing = isComposing, event),
      setCtrlKey: (event, ctrlKey) => (event.#ctrlKey = ctrlKey, event),
      setShiftKey: (event, shiftKey) => (event.#shiftKey = shiftKey, event),
      setAltKey: (event, altKey) => (event.#altKey = altKey, event),
      setMetaKey: (event, metaKey) => (event.#metaKey = metaKey, event),
      setCharCode: (event, charCode) => (event.#charCode = charCode, event),
      setKeyCode: (event, keyCode) => (event.#keyCode = keyCode, event),
      setWhich: (event, which) => (event.#which = which, event),
    };
  }
}

const KeyboardEventPrototype = _.webidl.createBranded(KeyboardEvent.prototype);
