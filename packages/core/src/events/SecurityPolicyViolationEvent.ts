import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import { Event, type EventInit } from "./Event.ts";

export type SecurityPolicyViolationEventDisposition = "enforce" | "report";

export interface SecurityPolicyViolationEventInit extends EventInit {
  blockedURI?: string;
  columnNumber?: number;
  disposition?: SecurityPolicyViolationEventDisposition;
  documentURI?: string;
  effectiveDirective?: string;
  lineNumber?: number;
  originalPolicy?: string;
  referrer?: string;
  sample?: string;
  sourceFile?: string;
  statusCode?: number;
  violatedDirective?: string;
}

declare module "dawm-internal" {
  export interface SecurityPolicyViolationEventInternal {
    new: (
      type: string,
      eventInitDict?: SecurityPolicyViolationEventInit,
    ) => SecurityPolicyViolationEvent;
    getBlockedURI(event: SecurityPolicyViolationEvent): string;
    setBlockedURI(
      event: SecurityPolicyViolationEvent,
      blockedURI: string,
    ): SecurityPolicyViolationEvent;
    getColumnNumber(event: SecurityPolicyViolationEvent): number;
    setColumnNumber(
      event: SecurityPolicyViolationEvent,
      columnNumber: number,
    ): SecurityPolicyViolationEvent;
    getDisposition(
      event: SecurityPolicyViolationEvent,
    ): SecurityPolicyViolationEventDisposition;
    setDisposition(
      event: SecurityPolicyViolationEvent,
      disposition: SecurityPolicyViolationEventDisposition,
    ): SecurityPolicyViolationEvent;
    getDocumentURI(event: SecurityPolicyViolationEvent): string;
    setDocumentURI(
      event: SecurityPolicyViolationEvent,
      documentURI: string,
    ): SecurityPolicyViolationEvent;
    getEffectiveDirective(event: SecurityPolicyViolationEvent): string;
    setEffectiveDirective(
      event: SecurityPolicyViolationEvent,
      effectiveDirective: string,
    ): SecurityPolicyViolationEvent;
    getLineNumber(event: SecurityPolicyViolationEvent): number;
    setLineNumber(
      event: SecurityPolicyViolationEvent,
      lineNumber: number,
    ): SecurityPolicyViolationEvent;
    getOriginalPolicy(event: SecurityPolicyViolationEvent): string;
    setOriginalPolicy(
      event: SecurityPolicyViolationEvent,
      originalPolicy: string,
    ): SecurityPolicyViolationEvent;
    getReferrer(event: SecurityPolicyViolationEvent): string;
    setReferrer(
      event: SecurityPolicyViolationEvent,
      referrer: string,
    ): SecurityPolicyViolationEvent;
    getSample(event: SecurityPolicyViolationEvent): string;
    setSample(
      event: SecurityPolicyViolationEvent,
      sample: string,
    ): SecurityPolicyViolationEvent;
    getSourceFile(event: SecurityPolicyViolationEvent): string;
    setSourceFile(
      event: SecurityPolicyViolationEvent,
      sourceFile: string,
    ): SecurityPolicyViolationEvent;
    getStatusCode(event: SecurityPolicyViolationEvent): number;
    setStatusCode(
      event: SecurityPolicyViolationEvent,
      statusCode: number,
    ): SecurityPolicyViolationEvent;
    getViolatedDirective(event: SecurityPolicyViolationEvent): string;
    setViolatedDirective(
      event: SecurityPolicyViolationEvent,
      violatedDirective: string,
    ): SecurityPolicyViolationEvent;
  }

  export interface internal {
    SecurityPolicyViolationEvent: SecurityPolicyViolationEventInternal;
  }
}

const SECURITY_POLICY_VIOLATION_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "blockedURI",
  "columnNumber",
  "disposition",
  "documentURI",
  "effectiveDirective",
  "lineNumber",
  "originalPolicy",
  "referrer",
  "sample",
  "sourceFile",
  "statusCode",
  "violatedDirective",
] as const;

function toDisposition(
  value: unknown,
): SecurityPolicyViolationEventDisposition {
  const str = _.webidl.converters.DOMString(value ?? "enforce");
  return str === "report" ? "report" : "enforce";
}

/**
 * Represents CSP violation reports delivered as DOM events.
 *
 * @example
 * ```ts
 * import { SecurityPolicyViolationEvent } from "dawm/events";
 *
 * const event = new SecurityPolicyViolationEvent("securitypolicyviolation", {
 *   blockedURI: "https://example.com/script.js",
 * });
 * event.blockedURI;
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent
 */
export class SecurityPolicyViolationEvent extends Event {
  #blockedURI = "";
  #columnNumber = 0;
  #disposition: SecurityPolicyViolationEventDisposition = "enforce";
  #documentURI = "";
  #effectiveDirective = "";
  #lineNumber = 0;
  #originalPolicy = "";
  #referrer = "";
  #sample = "";
  #sourceFile = "";
  #statusCode = 0;
  #violatedDirective = "";

  constructor(
    type: string,
    eventInitDict: SecurityPolicyViolationEventInit = {
      __proto__: null,
    } as SecurityPolicyViolationEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "SecurityPolicyViolationEvent";

    this.#blockedURI = eventInitDict.blockedURI === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.blockedURI);
    this.#columnNumber = eventInitDict.columnNumber === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.columnNumber);
    this.#disposition = toDisposition(eventInitDict.disposition);
    this.#documentURI = eventInitDict.documentURI === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.documentURI);
    this.#effectiveDirective = eventInitDict.effectiveDirective === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.effectiveDirective);
    this.#lineNumber = eventInitDict.lineNumber === undefined
      ? 0
      : _.webidl.converters["unsigned long"](eventInitDict.lineNumber);
    this.#originalPolicy = eventInitDict.originalPolicy === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.originalPolicy);
    this.#referrer = eventInitDict.referrer === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.referrer);
    this.#sample = eventInitDict.sample === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.sample);
    this.#sourceFile = eventInitDict.sourceFile === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.sourceFile);
    this.#statusCode = eventInitDict.statusCode === undefined
      ? 0
      : _.webidl.converters["unsigned short"](eventInitDict.statusCode);
    this.#violatedDirective = eventInitDict.violatedDirective === undefined
      ? ""
      : _.webidl.converters.DOMString(eventInitDict.violatedDirective);
  }

  get blockedURI(): string {
    return this.#blockedURI;
  }

  get columnNumber(): number {
    return this.#columnNumber;
  }

  get disposition(): SecurityPolicyViolationEventDisposition {
    return this.#disposition;
  }

  get documentURI(): string {
    return this.#documentURI;
  }

  get effectiveDirective(): string {
    return this.#effectiveDirective;
  }

  get lineNumber(): number {
    return this.#lineNumber;
  }

  get originalPolicy(): string {
    return this.#originalPolicy;
  }

  get referrer(): string {
    return this.#referrer;
  }

  get sample(): string {
    return this.#sample;
  }

  get sourceFile(): string {
    return this.#sourceFile;
  }

  get statusCode(): number {
    return this.#statusCode;
  }

  get violatedDirective(): string {
    return this.#violatedDirective;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(
      SecurityPolicyViolationEvent.prototype,
      kDenoCustomInspect,
      {
        __proto__: null,
        value(
          inspect: (v: unknown, o: Record<string, unknown>) => string,
          inspectOptions: Record<string, unknown>,
        ): string {
          return inspect(
            _.createFilteredInspectProxy({
              object: this,
              evaluate: ObjectIsPrototypeOf(
                SecurityPolicyViolationEventPrototype,
                this,
              ),
              keys: [...SECURITY_POLICY_VIOLATION_EVENT_PROPS],
            }),
            inspectOptions,
          );
        },
        configurable: true,
      } as PropertyDescriptor,
    );

    _.SecurityPolicyViolationEvent = {
      new: (type, eventInitDict) =>
        new SecurityPolicyViolationEvent(type, eventInitDict),
      getBlockedURI: (event) => event.#blockedURI,
      setBlockedURI: (
        event,
        blockedURI,
      ) => (event.#blockedURI = blockedURI, event),
      getColumnNumber: (event) => event.#columnNumber,
      setColumnNumber: (
        event,
        columnNumber,
      ) => (event.#columnNumber = columnNumber, event),
      getDisposition: (event) => event.#disposition,
      setDisposition: (
        event,
        disposition,
      ) => (event.#disposition = disposition, event),
      getDocumentURI: (event) => event.#documentURI,
      setDocumentURI: (
        event,
        documentURI,
      ) => (event.#documentURI = documentURI, event),
      getEffectiveDirective: (event) => event.#effectiveDirective,
      setEffectiveDirective: (
        event,
        effectiveDirective,
      ) => (event.#effectiveDirective = effectiveDirective, event),
      getLineNumber: (event) => event.#lineNumber,
      setLineNumber: (
        event,
        lineNumber,
      ) => (event.#lineNumber = lineNumber, event),
      getOriginalPolicy: (event) => event.#originalPolicy,
      setOriginalPolicy: (
        event,
        originalPolicy,
      ) => (event.#originalPolicy = originalPolicy, event),
      getReferrer: (event) => event.#referrer,
      setReferrer: (event, referrer) => (event.#referrer = referrer, event),
      getSample: (event) => event.#sample,
      setSample: (event, sample) => (event.#sample = sample, event),
      getSourceFile: (event) => event.#sourceFile,
      setSourceFile: (
        event,
        sourceFile,
      ) => (event.#sourceFile = sourceFile, event),
      getStatusCode: (event) => event.#statusCode,
      setStatusCode: (
        event,
        statusCode,
      ) => (event.#statusCode = statusCode, event),
      getViolatedDirective: (event) => event.#violatedDirective,
      setViolatedDirective: (
        event,
        violatedDirective,
      ) => (event.#violatedDirective = violatedDirective, event),
    };
  }
}

const SecurityPolicyViolationEventPrototype = _.webidl.createBranded(
  SecurityPolicyViolationEvent.prototype,
);
