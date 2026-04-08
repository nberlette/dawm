import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";
import type { Window } from "dawm-view/window";

export interface UIEventInit extends EventInit {
  detail?: number;
  view?: Window | null;
}

declare module "dawm-internal" {
  export interface UIEventInternal {
    new: (type: string, eventInitDict?: UIEventInit) => UIEvent;
    getView(event: UIEvent): Window | null;
    setView(event: UIEvent, view: Window | null): UIEvent;
    getDetail(event: UIEvent): number;
    setDetail(event: UIEvent, detail: number): UIEvent;
  }

  export interface internal {
    UIEvent: UIEventInternal;
  }
}

const UI_EVENT_PROPS = [
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
  "which",
] as const;

export class UIEvent extends Event {
  #detail = 0;
  #view: Window | null = null;

  constructor(
    type: string,
    eventInitDict: UIEventInit = { __proto__: null } as UIEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "UIEvent";

    this.#detail = eventInitDict.detail === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.detail);
    this.#view = eventInitDict.view ?? null;
  }

  get view(): Window | null {
    return this.#view;
  }

  get detail(): number {
    return this.#detail;
  }

  get which(): number {
    return 0;
  }

  initUIEvent(
    type: string,
    bubbles = false,
    cancelable = false,
    view: Window | null = null,
    detail = 0,
  ): void {
    _.webidl.requiredArguments(
      arguments.length,
      1,
      "Failed to execute 'initUIEvent' on 'UIEvent'",
    );

    if (_.Event.getDispatched(this)) {
      return;
    }

    type = _.webidl.converters.DOMString(
      type,
      "Failed to execute 'initUIEvent' on 'UIEvent'",
      "Argument 1",
    );

    _.Event.setType(this, type);
    _.Event.setBubbles(this, _.webidl.converters.boolean(bubbles));
    _.Event.setCancelable(this, _.webidl.converters.boolean(cancelable));
    this.#view = view;
    this.#detail = _.webidl.converters.long(detail);
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(UIEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(UIEventPrototype, this),
            keys: [...UI_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.UIEvent = {
      new: (type, eventInitDict) => new UIEvent(type, eventInitDict),
      getView: (event) => event.#view,
      setView: (event, view) => (event.#view = view, event),
      getDetail: (event) => event.#detail,
      setDetail: (event, detail) => (event.#detail = detail, event),
    };
  }
}

const UIEventPrototype = _.webidl.createBranded(UIEvent.prototype);
