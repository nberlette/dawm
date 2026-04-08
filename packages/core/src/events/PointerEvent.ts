import {
  _,
  ArrayPrototypePush,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { MouseEvent, type MouseEventInit } from "./MouseEvent.ts";

export interface PointerEventInit extends MouseEventInit {
  pointerId?: number;
  width?: number;
  height?: number;
  pressure?: number;
  tangentialPressure?: number;
  tiltX?: number;
  tiltY?: number;
  twist?: number;
  altitudeAngle?: number;
  azimuthAngle?: number;
  pointerType?: string;
  isPrimary?: boolean;
  coalescedEvents?: Iterable<PointerEvent> | ArrayLike<PointerEvent>;
  predictedEvents?: Iterable<PointerEvent> | ArrayLike<PointerEvent>;
  persistentDeviceId?: number;
}

declare module "dawm-internal" {
  export interface PointerEventInternal {
    new: (type: string, eventInitDict?: PointerEventInit) => PointerEvent;
    getPointerId(event: PointerEvent): number;
    setPointerId(event: PointerEvent, pointerId: number): PointerEvent;
    getWidth(event: PointerEvent): number;
    setWidth(event: PointerEvent, width: number): PointerEvent;
    getHeight(event: PointerEvent): number;
    setHeight(event: PointerEvent, height: number): PointerEvent;
    getPressure(event: PointerEvent): number;
    setPressure(event: PointerEvent, pressure: number): PointerEvent;
    getTangentialPressure(event: PointerEvent): number;
    setTangentialPressure(
      event: PointerEvent,
      tangentialPressure: number,
    ): PointerEvent;
    getTiltX(event: PointerEvent): number;
    setTiltX(event: PointerEvent, tiltX: number): PointerEvent;
    getTiltY(event: PointerEvent): number;
    setTiltY(event: PointerEvent, tiltY: number): PointerEvent;
    getTwist(event: PointerEvent): number;
    setTwist(event: PointerEvent, twist: number): PointerEvent;
    getAltitudeAngle(event: PointerEvent): number;
    setAltitudeAngle(event: PointerEvent, altitudeAngle: number): PointerEvent;
    getAzimuthAngle(event: PointerEvent): number;
    setAzimuthAngle(event: PointerEvent, azimuthAngle: number): PointerEvent;
    getPointerType(event: PointerEvent): string;
    setPointerType(event: PointerEvent, pointerType: string): PointerEvent;
    getIsPrimary(event: PointerEvent): boolean;
    setIsPrimary(event: PointerEvent, isPrimary: boolean): PointerEvent;
    getCoalescedEvents(event: PointerEvent): readonly PointerEvent[];
    setCoalescedEvents(
      event: PointerEvent,
      coalescedEvents: readonly PointerEvent[],
    ): PointerEvent;
    getPredictedEvents(event: PointerEvent): readonly PointerEvent[];
    setPredictedEvents(
      event: PointerEvent,
      predictedEvents: readonly PointerEvent[],
    ): PointerEvent;
    getPersistentDeviceId(event: PointerEvent): number;
    setPersistentDeviceId(
      event: PointerEvent,
      persistentDeviceId: number,
    ): PointerEvent;
  }

  export interface internal {
    PointerEvent: PointerEventInternal;
  }
}

const POINTER_EVENT_PROPS = [
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
  "pointerId",
  "width",
  "height",
  "pressure",
  "tangentialPressure",
  "tiltX",
  "tiltY",
  "twist",
  "altitudeAngle",
  "azimuthAngle",
  "pointerType",
  "isPrimary",
  "persistentDeviceId",
] as const;

function toPointerEventArray(value: unknown): PointerEvent[] {
  if (value) {
    if (_.isIterable<PointerEvent>(value)) return [...value];
    if (_.isArrayLikeObject<PointerEvent>(value)) {
      const out: PointerEvent[] = [];
      for (let i = 0; i < value.length; i++) {
        ArrayPrototypePush(out, value[i]);
      }
      return out;
    }
  }
  return [];
}

/**
 * Represents DOM pointer input events.
 *
 * @example
 * ```ts
 * import { PointerEvent } from "dawm/events";
 *
 * const event = new PointerEvent("pointerdown", { pointerId: 1 });
 * event.pointerId; // 1
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 */
export class PointerEvent extends MouseEvent {
  #pointerId = 0;
  #width = 1;
  #height = 1;
  #pressure = 0;
  #tangentialPressure = 0;
  #tiltX = 0;
  #tiltY = 0;
  #twist = 0;
  #altitudeAngle = 0;
  #azimuthAngle = 0;
  #pointerType = "";
  #isPrimary = false;
  #coalescedEvents: readonly PointerEvent[] = [];
  #predictedEvents: readonly PointerEvent[] = [];
  #persistentDeviceId = 0;

  constructor(
    type: string,
    eventInitDict: PointerEventInit = { __proto__: null } as PointerEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "PointerEvent";

    this.#pointerId = eventInitDict.pointerId === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.pointerId);
    this.#width = eventInitDict.width === undefined
      ? 1
      : _.webidl.converters.double(eventInitDict.width);
    this.#height = eventInitDict.height === undefined
      ? 1
      : _.webidl.converters.double(eventInitDict.height);
    this.#pressure = eventInitDict.pressure === undefined
      ? 0
      : _.webidl.converters.float(eventInitDict.pressure);
    this.#tangentialPressure = eventInitDict.tangentialPressure === undefined
      ? 0
      : _.webidl.converters.float(eventInitDict.tangentialPressure);
    this.#tiltX = eventInitDict.tiltX === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.tiltX);
    this.#tiltY = eventInitDict.tiltY === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.tiltY);
    this.#twist = eventInitDict.twist === undefined
      ? 0
      : _.webidl.converters.long(eventInitDict.twist);
    this.#altitudeAngle = eventInitDict.altitudeAngle === undefined
      ? 0
      : _.webidl.converters.double(eventInitDict.altitudeAngle);
    this.#azimuthAngle = eventInitDict.azimuthAngle === undefined
      ? 0
      : _.webidl.converters.double(eventInitDict.azimuthAngle);
    this.#pointerType = eventInitDict.pointerType === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.pointerType);
    this.#isPrimary = Boolean(eventInitDict.isPrimary);
    this.#coalescedEvents = toPointerEventArray(eventInitDict.coalescedEvents);
    this.#predictedEvents = toPointerEventArray(eventInitDict.predictedEvents);
    this.#persistentDeviceId = eventInitDict.persistentDeviceId === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.persistentDeviceId);
  }

  get pointerId(): number {
    return this.#pointerId;
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get pressure(): number {
    return this.#pressure;
  }

  get tangentialPressure(): number {
    return this.#tangentialPressure;
  }

  get tiltX(): number {
    return this.#tiltX;
  }

  get tiltY(): number {
    return this.#tiltY;
  }

  get twist(): number {
    return this.#twist;
  }

  get altitudeAngle(): number {
    return this.#altitudeAngle;
  }

  get azimuthAngle(): number {
    return this.#azimuthAngle;
  }

  get pointerType(): string {
    return this.#pointerType;
  }

  get isPrimary(): boolean {
    return this.#isPrimary;
  }

  get persistentDeviceId(): number {
    return this.#persistentDeviceId;
  }

  getCoalescedEvents(): PointerEvent[] {
    return [...this.#coalescedEvents];
  }

  getPredictedEvents(): PointerEvent[] {
    return [...this.#predictedEvents];
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(PointerEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(PointerEventPrototype, this),
            keys: [...POINTER_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.PointerEvent = {
      new: (type, eventInitDict) => new PointerEvent(type, eventInitDict),
      getPointerId: (event) => event.#pointerId,
      setPointerId: (event, pointerId) => (event.#pointerId = pointerId, event),
      getWidth: (event) => event.#width,
      setWidth: (event, width) => (event.#width = width, event),
      getHeight: (event) => event.#height,
      setHeight: (event, height) => (event.#height = height, event),
      getPressure: (event) => event.#pressure,
      setPressure: (event, pressure) => (event.#pressure = pressure, event),
      getTangentialPressure: (event) => event.#tangentialPressure,
      setTangentialPressure: (
        event,
        tangentialPressure,
      ) => (event.#tangentialPressure = tangentialPressure, event),
      getTiltX: (event) => event.#tiltX,
      setTiltX: (event, tiltX) => (event.#tiltX = tiltX, event),
      getTiltY: (event) => event.#tiltY,
      setTiltY: (event, tiltY) => (event.#tiltY = tiltY, event),
      getTwist: (event) => event.#twist,
      setTwist: (event, twist) => (event.#twist = twist, event),
      getAltitudeAngle: (event) => event.#altitudeAngle,
      setAltitudeAngle: (
        event,
        altitudeAngle,
      ) => (event.#altitudeAngle = altitudeAngle, event),
      getAzimuthAngle: (event) => event.#azimuthAngle,
      setAzimuthAngle: (
        event,
        azimuthAngle,
      ) => (event.#azimuthAngle = azimuthAngle, event),
      getPointerType: (event) => event.#pointerType,
      setPointerType: (
        event,
        pointerType,
      ) => (event.#pointerType = pointerType, event),
      getIsPrimary: (event) => event.#isPrimary,
      setIsPrimary: (event, isPrimary) => (event.#isPrimary = isPrimary, event),
      getCoalescedEvents: (event) => event.#coalescedEvents,
      setCoalescedEvents: (
        event,
        coalescedEvents,
      ) => (event.#coalescedEvents = [...coalescedEvents], event),
      getPredictedEvents: (event) => event.#predictedEvents,
      setPredictedEvents: (
        event,
        predictedEvents,
      ) => (event.#predictedEvents = [...predictedEvents], event),
      getPersistentDeviceId: (event) => event.#persistentDeviceId,
      setPersistentDeviceId: (
        event,
        persistentDeviceId,
      ) => (event.#persistentDeviceId = persistentDeviceId, event),
    };
  }
}

const PointerEventPrototype = _.webidl.createBranded(PointerEvent.prototype);
