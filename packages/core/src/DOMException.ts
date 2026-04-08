/**
 * @module DOMException
 */
import { getLegacyCode } from "./_domexception_helpers.ts";
import {
  _,
  defineConstants,
  ErrorCaptureStackTrace,
  isObject,
  ObjectDefineProperty,
  ReflectConstruct,
  SymbolHasInstance,
  SymbolToStringTag,
  toStringTag,
} from "dawm-internal";

const kDOMException: unique symbol = Symbol("DOMException");

/**
 * Options for constructing a new {@linkcode DOMException} instance.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException/DOMException#parameters
 */
export interface DOMExceptionOptions extends ErrorOptions {
  name?: string;
}

/**
 * Ponyfill for the `DOMException` interface found in web browsers, Deno, Bun,
 * and recent versions of Node.js. This implementation is designed to be both
 * compliant with the DOM standard and also compatible with older environments.
 *
 * [MDN Reference](https://mdn.io/DOMException)
 *
 * @remarks
 * It emulates the standard `DOMException` API surface and behavior, including
 * legacy error codes, while also extending the native `Error` API to capture
 * stack traces and other error-related information (this strategy is the same
 * pattern used by Deno's implementation under the hood).
 *
 * Properties inherited from the native `Error` class are set as read‑only and
 * enumerable so that instances can be structured-cloned or transferred between
 * Workers.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMException
 *
 * @example
 * ```ts
 * import { DOMException } from "@nick/domexception";
 * import assert from "node:assert";
 *
 * export function getArrayElement<T>(array: T[], index: number): T {
 *   if (index < 0 || index >= array.length) {
 *     throw new DOMException("Invalid array index", "IndexSizeError");
 *   }
 *   return array[index];
 * }
 *
 * assert.throws(() => getArrayElement([1, 2], 3), DOMException);
 * ```
 */
export class DOMException {
  static readonly INDEX_SIZE_ERR = 1 as const;
  static readonly DOMSTRING_SIZE_ERR = 2 as const;
  static readonly HIERARCHY_REQUEST_ERR = 3 as const;
  static readonly WRONG_DOCUMENT_ERR = 4 as const;
  static readonly INVALID_CHARACTER_ERR = 5 as const;
  static readonly NO_DATA_ALLOWED_ERR = 6 as const;
  static readonly NO_MODIFICATION_ALLOWED_ERR = 7 as const;
  static readonly NOT_FOUND_ERR = 8 as const;
  static readonly NOT_SUPPORTED_ERR = 9 as const;
  static readonly INUSE_ATTRIBUTE_ERR = 10 as const;
  static readonly INVALID_STATE_ERR = 11 as const;
  static readonly SYNTAX_ERR = 12 as const;
  static readonly INVALID_MODIFICATION_ERR = 13 as const;
  static readonly NAMESPACE_ERR = 14 as const;
  static readonly INVALID_ACCESS_ERR = 15 as const;
  static readonly VALIDATION_ERR = 16 as const;
  static readonly TYPE_MISMATCH_ERR = 17 as const;
  static readonly SECURITY_ERR = 18 as const;
  static readonly NETWORK_ERR = 19 as const;
  static readonly ABORT_ERR = 20 as const;
  static readonly URL_MISMATCH_ERR = 21 as const;
  static readonly QUOTA_EXCEEDED_ERR = 22 as const;
  static readonly TIMEOUT_ERR = 23 as const;
  static readonly INVALID_NODE_TYPE_ERR = 24 as const;
  static readonly DATA_CLONE_ERR = 25 as const;

  static [SymbolHasInstance](it: unknown): it is DOMException {
    return isObject(it) && kDOMException in it &&
      it[kDOMException] === kDOMException;
  }

  declare readonly INDEX_SIZE_ERR: 1;
  declare readonly DOMSTRING_SIZE_ERR: 2;
  declare readonly HIERARCHY_REQUEST_ERR: 3;
  declare readonly WRONG_DOCUMENT_ERR: 4;
  declare readonly INVALID_CHARACTER_ERR: 5;
  declare readonly NO_DATA_ALLOWED_ERR: 6;
  declare readonly NO_MODIFICATION_ALLOWED_ERR: 7;
  declare readonly NOT_FOUND_ERR: 8;
  declare readonly NOT_SUPPORTED_ERR: 9;
  declare readonly INUSE_ATTRIBUTE_ERR: 10;
  declare readonly INVALID_STATE_ERR: 11;
  declare readonly SYNTAX_ERR: 12;
  declare readonly INVALID_MODIFICATION_ERR: 13;
  declare readonly NAMESPACE_ERR: 14;
  declare readonly INVALID_ACCESS_ERR: 15;
  declare readonly VALIDATION_ERR: 16;
  declare readonly TYPE_MISMATCH_ERR: 17;
  declare readonly SECURITY_ERR: 18;
  declare readonly NETWORK_ERR: 19;
  declare readonly ABORT_ERR: 20;
  declare readonly URL_MISMATCH_ERR: 21;
  declare readonly QUOTA_EXCEEDED_ERR: 22;
  declare readonly TIMEOUT_ERR: 23;
  declare readonly INVALID_NODE_TYPE_ERR: 24;
  declare readonly DATA_CLONE_ERR: 25;

  /**
   * Legacy error code value. (Deprecated)
   * @readonly
   */
  declare readonly code: number;
  /**
   * The error message.
   * @readonly
   */
  declare readonly message: string;
  /**
   * The error name.
   * @readonly
   */
  declare readonly name: string;
  /**
   * The error stack trace.
   * @readonly
   */
  declare readonly stack?: string;

  /**
   * Creates a new DOMException instance.
   *
   * @param message - The error message.
   * @param options - An object containing the error name.
   */
  constructor(message: string, options: DOMExceptionOptions);
  /**
   * Creates a new DOMException instance.
   *
   * @param message - The error message.
   * @param name - The error name.
   */
  constructor(message?: string, name?: string);
  constructor(message?: string, nameOrOptions?: string | DOMExceptionOptions);
  constructor(message?: string, nameOrOptions?: string | DOMExceptionOptions) {
    let options: DOMExceptionOptions;

    if (typeof nameOrOptions === "string") {
      options = { name: nameOrOptions };
    } else if (nameOrOptions && typeof nameOrOptions === "object") {
      options = nameOrOptions;
    } else if (nameOrOptions != null) {
      throw new TypeError(
        "The second argument to DOMException must be a string or an object",
      );
    } else {
      options = {};
    }

    const name = options.name || "Error";
    const cause = options.cause;
    const text = message || "";
    const error = ReflectConstruct(Error, [text, { cause }], new.target);
    const code = getLegacyCode(name);

    // Ensure properties are non-writable and enumerable.
    ObjectDefineProperty(error, "message", {
      __proto__: null,
      value: message,
      configurable: false,
      writable: false,
      enumerable: true,
    } as PropertyDescriptor);
    ObjectDefineProperty(error, "name", {
      __proto__: null,
      value: name,
      configurable: false,
      writable: false,
      enumerable: true,
    } as PropertyDescriptor);
    ObjectDefineProperty(error, "code", {
      __proto__: null,
      value: code,
      configurable: false,
      writable: false,
      enumerable: true,
    } as PropertyDescriptor);
    if (cause != null) {
      ObjectDefineProperty(error, "cause", {
        __proto__: null,
        value: cause,
        configurable: false,
        writable: false,
        enumerable: true,
      } as PropertyDescriptor);
    }
    ObjectDefineProperty(error, kDOMException, {
      __proto__: null,
      value: kDOMException,
      configurable: false,
      writable: false,
      enumerable: false,
    } as PropertyDescriptor);

    // ensure the stack trace is captured
    if (ErrorCaptureStackTrace) {
      ErrorCaptureStackTrace(error, this.constructor);
      error.stack; // force the stack property to be created
    }

    return error as unknown as this; // janky but it's what Deno does, too
  }

  toString(): string {
    return `${this.name}: ${this.message}`;
  }

  declare readonly [SymbolToStringTag]: "DOMException";

  static {
    toStringTag("DOMException")(this);
  }

  static {
    defineConstants(
      DOMException,
      ["INDEX_SIZE_ERR", 1],
      ["DOMSTRING_SIZE_ERR", 2],
      ["HIERARCHY_REQUEST_ERR", 3],
      ["WRONG_DOCUMENT_ERR", 4],
      ["INVALID_CHARACTER_ERR", 5],
      ["NO_DATA_ALLOWED_ERR", 6],
      ["NO_MODIFICATION_ALLOWED_ERR", 7],
      ["NOT_FOUND_ERR", 8],
      ["NOT_SUPPORTED_ERR", 9],
      ["INUSE_ATTRIBUTE_ERR", 10],
      ["INVALID_STATE_ERR", 11],
      ["SYNTAX_ERR", 12],
      ["INVALID_MODIFICATION_ERR", 13],
      ["NAMESPACE_ERR", 14],
      ["INVALID_ACCESS_ERR", 15],
      ["VALIDATION_ERR", 16],
      ["TYPE_MISMATCH_ERR", 17],
      ["SECURITY_ERR", 18],
      ["NETWORK_ERR", 19],
      ["ABORT_ERR", 20],
      ["URL_MISMATCH_ERR", 21],
      ["QUOTA_EXCEEDED_ERR", 22],
      ["TIMEOUT_ERR", 23],
      ["INVALID_NODE_TYPE_ERR", 24],
      ["DATA_CLONE_ERR", 25],
    );
  }
}
