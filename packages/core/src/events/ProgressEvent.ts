import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";
import type { EventTarget } from "./EventTarget.ts";

export interface ProgressEventInit extends EventInit {
  lengthComputable?: boolean;
  loaded?: number;
  total?: number;
}

declare module "dawm-internal" {
  export interface ProgressEventInternal {
    new: (type: string, eventInitDict?: ProgressEventInit) => ProgressEvent;
    getLengthComputable(event: ProgressEvent): boolean;
    setLengthComputable(
      event: ProgressEvent,
      lengthComputable: boolean,
    ): ProgressEvent;
    getLoaded(event: ProgressEvent): number;
    setLoaded(event: ProgressEvent, loaded: number): ProgressEvent;
    getTotal(event: ProgressEvent): number;
    setTotal(event: ProgressEvent, total: number): ProgressEvent;
  }

  export interface internal {
    ProgressEvent: ProgressEventInternal;
  }
}

const PROGRESS_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "lengthComputable",
  "loaded",
  "total",
] as const;

export class ProgressEvent<T extends EventTarget = EventTarget> extends Event {
  #lengthComputable = false;
  #loaded = 0;
  #total = 0;

  constructor(
    type: string,
    eventInitDict: ProgressEventInit = { __proto__: null } as ProgressEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "ProgressEvent";

    this.#lengthComputable = Boolean(eventInitDict.lengthComputable);
    this.#loaded = eventInitDict.loaded === undefined
      ? 0
      : _.webidl.converters["unsigned long long"](eventInitDict.loaded);
    this.#total = eventInitDict.total === undefined
      ? 0
      : _.webidl.converters["unsigned long long"](eventInitDict.total);
  }

  get lengthComputable(): boolean {
    return this.#lengthComputable;
  }

  get loaded(): number {
    return this.#loaded;
  }

  get total(): number {
    return this.#total;
  }

  declare readonly [SymbolToStringTag]: "ProgressEvent";

  override get target(): T | null {
    return super.target as T | null;
  }

  static {
    ObjectDefineProperty(ProgressEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(ProgressEventPrototype, this),
            keys: [...PROGRESS_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.ProgressEvent = {
      new: (type, eventInitDict) => new ProgressEvent(type, eventInitDict),
      getLengthComputable: (event) => event.#lengthComputable,
      setLengthComputable: (
        event,
        lengthComputable,
      ) => (event.#lengthComputable = lengthComputable, event),
      getLoaded: (event) => event.#loaded,
      setLoaded: (event, loaded) => (event.#loaded = loaded, event),
      getTotal: (event) => event.#total,
      setTotal: (event, total) => (event.#total = total, event),
    };
  }
}

const ProgressEventPrototype = _.webidl.createBranded(ProgressEvent.prototype);
