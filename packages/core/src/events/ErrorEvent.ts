import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export interface ErrorEventInit extends EventInit {
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
}

declare module "dawm-internal" {
  export interface ErrorEventInternal {
    new: (type: string, eventInitDict?: ErrorEventInit) => ErrorEvent;
    getMessage(event: ErrorEvent): string;
    setMessage(event: ErrorEvent, message: string): ErrorEvent;
    getFilename(event: ErrorEvent): string;
    setFilename(event: ErrorEvent, filename: string): ErrorEvent;
    getLineno(event: ErrorEvent): number;
    setLineno(event: ErrorEvent, lineno: number): ErrorEvent;
    getColno(event: ErrorEvent): number;
    setColno(event: ErrorEvent, colno: number): ErrorEvent;
    getError(event: ErrorEvent): unknown;
    setError(event: ErrorEvent, error: unknown): ErrorEvent;
  }

  export interface internal {
    ErrorEvent: ErrorEventInternal;
  }
}

const ERROR_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "message",
  "filename",
  "lineno",
  "colno",
  "error",
] as const;

export class ErrorEvent extends Event {
  #message = "";
  #filename = "";
  #lineno = 0;
  #colno = 0;
  #error: unknown = undefined;

  constructor(
    type: string,
    eventInitDict: ErrorEventInit = { __proto__: null } as ErrorEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "ErrorEvent";

    this.#message = eventInitDict.message === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.message);
    this.#filename = eventInitDict.filename === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.filename);
    this.#lineno = eventInitDict.lineno === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.lineno);
    this.#colno = eventInitDict.colno === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.colno);
    this.#error = eventInitDict.error;
  }

  get message(): string {
    return this.#message;
  }

  get filename(): string {
    return this.#filename;
  }

  get lineno(): number {
    return this.#lineno;
  }

  get colno(): number {
    return this.#colno;
  }

  get error(): unknown {
    return this.#error;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(ErrorEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(ErrorEventPrototype, this),
            keys: [...ERROR_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.ErrorEvent = {
      new: (type, eventInitDict) => new ErrorEvent(type, eventInitDict),
      getMessage: (event) => event.#message,
      setMessage: (event, message) => (event.#message = message, event),
      getFilename: (event) => event.#filename,
      setFilename: (event, filename) => (event.#filename = filename, event),
      getLineno: (event) => event.#lineno,
      setLineno: (event, lineno) => (event.#lineno = lineno, event),
      getColno: (event) => event.#colno,
      setColno: (event, colno) => (event.#colno = colno, event),
      getError: (event) => event.#error,
      setError: (event, error) => (event.#error = error, event),
    };
  }
}

const ErrorEventPrototype = _.webidl.createBranded(ErrorEvent.prototype);
