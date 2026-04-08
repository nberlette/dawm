import {
  $globalThis,
  _,
  ArrayPrototypeMap,
  ArrayPrototypePush,
  ArrayPrototypeUnshift,
  defineConstants,
  ObjectDefineProperties,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Converter } from "dawm-webidl/converters";
import type { EventTarget } from "./EventTarget.ts";
import {
  _attributes,
  _canceledFlag,
  _dispatched,
  _inPassiveListener,
  _isTrusted,
  _path,
  _stopImmediatePropagationFlag,
  _stopPropagationFlag,
  asEventInternals,
  EventAttributes,
  EventInternals,
  EventPathEntry,
} from "./EventAttributes.ts";

declare module "dawm-internal" {
  export interface EventInternal {
    new: (type: string, eventInitDict?: EventInit) => Event;
    newTrusted: (
      type: string,
      eventInitDict?: EventInit,
    ) => Event & { readonly isTrusted: true };

    setType(event: Event, type: string): Event;
    setTarget(event: Event, target: EventTarget | null): Event;
    setCurrentTarget(event: Event, currentTarget: EventTarget | null): Event;
    setEventPhase(event: Event, eventPhase: number): Event;
    setBubbles(event: Event, bubbles: boolean): Event;
    setCancelable(event: Event, cancelable: boolean): Event;
    setComposed(event: Event, composed: boolean): Event;
    setTimeStamp(event: Event, timeStamp: number): Event;

    getAttributes(event: Event): EventAttributes;
    setAttributes(event: Event, attributes: EventAttributes): Event;
    getCanceledFlag(event: Event): boolean;
    setCanceledFlag(event: Event, canceledFlag: boolean): Event;
    getStopPropagationFlag(event: Event): boolean;
    setStopPropagationFlag(event: Event, stopPropagationFlag: boolean): Event;
    getStopImmediatePropagationFlag(event: Event): boolean;
    setStopImmediatePropagationFlag(
      event: Event,
      stopImmediatePropagationFlag: boolean,
    ): Event;
    getInPassiveListener(event: Event): boolean;
    setInPassiveListener(event: Event, inPassiveListener: boolean): Event;
    getDispatched(event: Event): boolean;
    setDispatched(event: Event, dispatched: boolean): Event;
    getIsTrusted(event: Event): boolean;
    setIsTrusted(event: Event, isTrusted: boolean): Event;
    getPath(event: Event): EventPathEntry[];
    setPath(event: Event, path: EventPathEntry[]): Event;

    isNativeEvent(it: unknown): it is NativeEvent;
    isDawmEvent(it: unknown): it is Event;
    isEventLike(it: unknown): it is NativeEvent | Event;
  }

  export interface internal {
    Event: EventInternal;
  }
}

declare module "dawm-webidl/converters" {
  export interface Converters {
    "EventInit": Converter<EventInit>;
    "EventInit?": Converter<EventInit | null>;
    "Event": Converter<Event>;
    "EventListener": Converter<EventListener>;
    "EventListener?": Converter<EventListener | null>;
    "EventListenerObject": Converter<EventListenerObject>;
    "EventListenerObject?": Converter<EventListenerObject | null>;
    "EventListenerOrEventListenerObject": Converter<
      EventListenerOrEventListenerObject
    >;
    "EventListenerOrEventListenerObject?": Converter<
      EventListenerOrEventListenerObject | null
    >;
  }
}

/**
 * Represents the initialization dictionary for an {@linkcode Event}, which can
 * be passed to the constructor of {@linkcode Event} and its subclasses to set
 * the values of the event's attributes at creation time.
 *
 * Note: Specialized event subclasses will typically extend this dictionary
 * with additional attributes specific to the event type they represent.
 *
 * @category Types
 * @tags Event, EventInit
 */
export interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

export class Event {
  constructor(
    type: string,
    eventInitDict: EventInit = { __proto__: null } as EventInit,
  ) {
    _.webidl.requiredArguments(
      arguments.length,
      1,
      "Failed to construct 'Event'",
    );

    type = _.webidl.converters.DOMString(
      type,
      "Failed to construct 'Event'",
      "Argument 1",
    );

    const isTrusted = !!((eventInitDict as any)[_isTrusted] ??
      arguments[arguments.length - 1] === _isTrusted);

    const self = this as {} as EventInternals;
    self[SymbolToStringTag] = "Event";
    self[_canceledFlag] = false;
    self[_stopPropagationFlag] = false;
    self[_stopImmediatePropagationFlag] = false;
    self[_inPassiveListener] = false;
    self[_dispatched] = false;
    self[_isTrusted] = isTrusted;
    self[_path] = [];
    self[_.webidl.brand] = _.webidl.brand;
    self[_attributes] = {
      type,
      bubbles: !!eventInitDict.bubbles,
      cancelable: !!eventInitDict.cancelable,
      composed: !!eventInitDict.composed,
      currentTarget: null,
      eventPhase: Event.NONE,
      target: null,
      timeStamp: 0,
    };

    ObjectDefineProperties(self, {
      __proto__: null!,
      [_attributes]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_canceledFlag]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_stopPropagationFlag]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_stopImmediatePropagationFlag]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_inPassiveListener]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_dispatched]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
      },
      [_isTrusted]: { __proto__: null, enumerable: false, configurable: false },
      [_path]: { __proto__: null, enumerable: false, configurable: false },
      [_.webidl.brand]: {
        __proto__: null,
        enumerable: false,
        configurable: false,
        writable: false,
      },
      //
      // [LegacyUnforgeable] boolean isTrusted
      isTrusted: {
        __proto__: null,
        configurable: false,
        enumerable: true,
        get: function isTrusted() {
          _.webidl.assertBranded(this, EventPrototype);
          if (!(_isTrusted in this)) {
            _.webidl.illegalInvocation(
              "The Event.isTrusted getter can only be used on instances of Event.",
              isTrusted,
            );
          }
          return _.webidl.converters.boolean(this[_isTrusted]);
        },
      } as PropertyDescriptor & ThisType<Event>,
    } as PropertyDescriptorMap);
  }

  get type(): string {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].type;
  }

  get target(): EventTarget | null {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].target;
  }

  get srcElement(): EventTarget | null {
    _.webidl.assertBranded(this, EventPrototype);
    return null;
  }

  set srcElement(value: EventTarget | null) {
    _.webidl.assertBranded(this, EventPrototype);
    void value;
    // this member is deprecated
  }

  get currentTarget(): EventTarget | null {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].currentTarget;
  }

  get eventPhase(): number {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].eventPhase;
  }

  get cancelBubble(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_stopPropagationFlag];
  }

  set cancelBubble(value: boolean) {
    _.webidl.assertBranded(this, EventPrototype);
    (this as {} as EventInternals)[_stopPropagationFlag] = _.webidl.converters
      .boolean(
        value,
      );
  }

  get bubbles(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].bubbles;
  }

  get cancelable(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].cancelable;
  }

  get returnValue(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return !(this as {} as EventInternals)[_canceledFlag];
  }

  set returnValue(value: boolean) {
    _.webidl.assertBranded(this, EventPrototype);
    if (!_.webidl.converters.boolean(value)) {
      (this as {} as EventInternals)[_canceledFlag] = true;
    }
  }

  get defaultPrevented(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_canceledFlag];
  }

  get composed(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].composed;
  }

  get timeStamp(): number {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_attributes].timeStamp;
  }

  get isTrusted(): boolean {
    _.webidl.assertBranded(this, EventPrototype);
    return (this as {} as EventInternals)[_isTrusted];
  }

  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
    _.webidl.assertBranded(this, EventPrototype);
    const self = this as {} as EventInternals;
    if (self[_dispatched]) return;
    self[_attributes].type = type;
    self[_attributes].bubbles = !!bubbles;
    self[_attributes].cancelable = !!cancelable;
    self[_attributes].composed = false;
  }

  composedPath(): EventTarget[] {
    _.webidl.assertBranded(this, EventPrototype);
    const self = this as {} as EventInternals;
    const path = self[_path];
    if (path.length === 0) return [];

    if (!this.currentTarget) {
      throw new Error("assertion error");
    }
    const composedPath = [
      {
        item: this.currentTarget,
        itemInShadowTree: false,
        relatedTarget: null,
        rootOfClosedTree: false,
        slotInClosedTree: false,
        target: null,
        touchTargetList: [],
      },
    ];

    let currentTargetIndex = 0;
    let currentTargetHiddenSubtreeLevel = 0;

    for (let index = path.length - 1; index >= 0; index--) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[index];

      if (rootOfClosedTree) {
        currentTargetHiddenSubtreeLevel++;
      }

      if (item === this.currentTarget) {
        currentTargetIndex = index;
        break;
      }

      if (slotInClosedTree) {
        currentTargetHiddenSubtreeLevel--;
      }
    }

    let currentHiddenLevel = currentTargetHiddenSubtreeLevel;
    let maxHiddenLevel = currentTargetHiddenSubtreeLevel;

    for (let i = currentTargetIndex - 1; i >= 0; i--) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[i];

      if (rootOfClosedTree) {
        currentHiddenLevel++;
      }

      if (currentHiddenLevel <= maxHiddenLevel) {
        ArrayPrototypeUnshift(composedPath, {
          item,
          itemInShadowTree: false,
          relatedTarget: null,
          rootOfClosedTree: false,
          slotInClosedTree: false,
          target: null,
          touchTargetList: [],
        });
      }

      if (slotInClosedTree) {
        currentHiddenLevel--;

        if (currentHiddenLevel < maxHiddenLevel) {
          maxHiddenLevel = currentHiddenLevel;
        }
      }
    }

    currentHiddenLevel = currentTargetHiddenSubtreeLevel;
    maxHiddenLevel = currentTargetHiddenSubtreeLevel;

    for (let index = currentTargetIndex + 1; index < path.length; index++) {
      const { item, rootOfClosedTree, slotInClosedTree } = path[index];

      if (slotInClosedTree) {
        currentHiddenLevel++;
      }

      if (currentHiddenLevel <= maxHiddenLevel) {
        ArrayPrototypePush(composedPath, {
          item,
          itemInShadowTree: false,
          relatedTarget: null,
          rootOfClosedTree: false,
          slotInClosedTree: false,
          target: null,
          touchTargetList: [],
        });
      }

      if (rootOfClosedTree) {
        currentHiddenLevel--;

        if (currentHiddenLevel < maxHiddenLevel) {
          maxHiddenLevel = currentHiddenLevel;
        }
      }
    }
    return ArrayPrototypeMap(composedPath, (p) => p.item);
  }

  stopPropagation(): void {
    _.webidl.assertBranded(this, EventPrototype);
    (this as {} as EventInternals)[_stopPropagationFlag] = true;
  }

  stopImmediatePropagation(): void {
    _.webidl.assertBranded(this, EventPrototype);
    const self = this as {} as EventInternals;
    self[_stopPropagationFlag] = true;
    self[_stopImmediatePropagationFlag] = true;
  }

  preventDefault(): void {
    _.webidl.assertBranded(this, EventPrototype);
    const self = this as {} as EventInternals;
    if (self[_attributes].cancelable && !self[_inPassiveListener]) {
      self[_canceledFlag] = true;
    }
  }

  declare readonly NONE: 0;
  declare readonly CAPTURING_PHASE: 1;
  declare readonly AT_TARGET: 2;
  declare readonly BUBBLING_PHASE: 3;

  static readonly NONE = 0 as const;
  static readonly CAPTURING_PHASE = 1 as const;
  static readonly AT_TARGET = 2 as const;
  static readonly BUBBLING_PHASE = 3 as const;

  static {
    defineConstants(
      Event,
      ["NONE", 0],
      ["CAPTURING_PHASE", 1],
      ["AT_TARGET", 2],
      ["BUBBLING_PHASE", 3],
    );

    ObjectDefineProperty(Event.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: any, o: any) => string,
        inspectOptions: Record<string, any>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(EventPrototype, this),
            keys: [
              "type",
              "target",
              "currentTarget",
              "eventPhase",
              "bubbles",
              "cancelable",
              "composed",
              "timeStamp",
            ],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);
  }

  static {
    _.Event = {
      new: (type, eventInitDict) => new Event(type, eventInitDict),
      newTrusted: (type, eventInitDict) =>
        new Event(
          type,
          { ...eventInitDict, [_isTrusted]: true } as EventInit,
        ) as Event & { isTrusted: true },
      setType: (e, t) => (asEventInternals(e)[_attributes].type = t, e),
      setTarget: (e, t) => (asEventInternals(e)[_attributes].target = t, e),
      setCurrentTarget: (
        e,
        ct,
      ) => (asEventInternals(e)[_attributes].currentTarget = ct, e),
      setEventPhase: (
        e,
        ep,
      ) => (asEventInternals(e)[_attributes].eventPhase = ep, e),
      setBubbles: (e, b) => (asEventInternals(e)[_attributes].bubbles = b, e),
      setCancelable: (
        e,
        c,
      ) => (asEventInternals(e)[_attributes].cancelable = c, e),
      setComposed: (e, c) => (asEventInternals(e)[_attributes].composed = c, e),
      setTimeStamp: (
        e,
        ts,
      ) => (asEventInternals(e)[_attributes].timeStamp = ts, e),
      getAttributes: (e) => asEventInternals(e)[_attributes],
      setAttributes: (e, a) => (asEventInternals(e)[_attributes] = a, e),
      getCanceledFlag: (e) => asEventInternals(e)[_canceledFlag],
      setCanceledFlag: (e, f) => (asEventInternals(e)[_canceledFlag] = f, e),
      getStopPropagationFlag: (e) => asEventInternals(e)[_stopPropagationFlag],
      setStopPropagationFlag: (
        e,
        f,
      ) => (asEventInternals(e)[_stopPropagationFlag] = f, e),
      getStopImmediatePropagationFlag: (e) =>
        asEventInternals(e)[_stopImmediatePropagationFlag],
      setStopImmediatePropagationFlag: (
        e,
        f,
      ) => (asEventInternals(e)[_stopImmediatePropagationFlag] = f, e),
      getInPassiveListener: (e) => asEventInternals(e)[_inPassiveListener],
      setInPassiveListener: (
        e,
        f,
      ) => (asEventInternals(e)[_inPassiveListener] = f, e),
      getDispatched: (e) => asEventInternals(e)[_dispatched],
      setDispatched: (e, f) => (asEventInternals(e)[_dispatched] = f, e),
      getIsTrusted: (e) => asEventInternals(e)[_isTrusted],
      setIsTrusted: (e, f) => (asEventInternals(e)[_isTrusted] = f, e),
      getPath: (e) => asEventInternals(e)[_path],
      setPath: (e, p) => (asEventInternals(e)[_path] = p, e),
      isNativeEvent: (it): it is NativeEvent =>
        _.isObject(it) && _.isObject(NativeEventPrototype) &&
        ObjectIsPrototypeOf(NativeEventPrototype, it),
      isDawmEvent: (it): it is Event =>
        _.isObject(it) && ObjectIsPrototypeOf(EventPrototype, it) &&
        _isTrusted in it,
      isEventLike: (it): it is Event | NativeEvent =>
        _.Event.isNativeEvent(it) || _.Event.isDawmEvent(it),
    };
  }
}

const NativeEvent: typeof globalThis.Event | null = (() => {
  if (_.isFunction($globalThis.Event) && $globalThis.Event !== Event) {
    return $globalThis.Event;
  }
  return null;
})();

type NativeEvent = InstanceType<typeof NativeEvent & {}>;

const NativeEventPrototype: NativeEvent | null = NativeEvent?.prototype ?? null;

const EventPrototype = Event.prototype;

_.webidl.converters.define(
  "EventInit",
  Converter.dictionary([
    {
      key: "bubbles",
      converter: _.webidl.converters.boolean,
      defaultValue: false,
    },
    {
      key: "cancelable",
      converter: _.webidl.converters.boolean,
      defaultValue: false,
    },
    {
      key: "composed",
      converter: _.webidl.converters.boolean,
      defaultValue: false,
    },
  ], { name: "EventInit" }),
);
_.webidl.converters.define("Event", Converter.interface(Event));
_.webidl.converters.define("EventListener", Converter.callback);
_.webidl.converters.define(
  "EventListenerObject",
  Converter.dictionary([
    { key: "handleEvent", converter: Converter.callback },
  ], { name: "EventListenerObject" }),
);
_.webidl.converters.define(
  "EventListenerOrEventListenerObject",
  new Converter((V, ...args) => {
    const O = _.webidl.util.toConverterOptions(args, {
      prefix: "Failed to convert value to EventListenerOrEventListenerObject",
      argument: "value",
      types: ["EventListener", "EventListenerObject"],
    });
    try {
      return _.webidl.converters.EventListener(V, O);
    } catch {
      try {
        return _.webidl.converters.EventListenerObject(V, O);
      } catch {
        throw _.webidl.errors.conversionFailed(O);
      }
    }
  }, "EventListenerOrEventListenerObject"),
);

_.webidl.converters.define(
  "EventInit?",
  Converter.nullable(_.webidl.converters.EventInit),
);
