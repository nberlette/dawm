import { contentType } from "@std/media-types/content-type";
import { getCharset } from "@std/media-types/get-charset";
import {
  $globalThis,
  ErrorCaptureStackTrace,
  JSONParse,
  ObjectDefineProperty,
} from "../../internal/primordials.ts";

export { contentType, getCharset };

export const kUploadBrand: unique symbol = Symbol.for(
  "dawm.XMLHttpRequestUpload",
);

export type kUploadBrand = typeof kUploadBrand;

export function assert(
  cond: unknown,
  msg = "assertion failed",
): asserts cond {
  if (!cond) {
    const err = new Error(msg);
    err.name = "AssertionError";
    ErrorCaptureStackTrace?.(err, assert);
    err.stack; // force stack trace generation
    throw err;
  }
}

export function extractLength(response: Response) {
  const values = response.headers.get("content-length")?.split(/\s*,\s*/) ?? [];
  let candidateValue: string | null = null;
  for (const value of values) {
    if (candidateValue == null) {
      candidateValue = value;
    } else if (value !== candidateValue) {
      throw new Error("invalid content-length");
    }
  }
  if (candidateValue == "" || candidateValue == null) {
    return null;
  }
  const v = parseInt(candidateValue, 10);
  return Number.isNaN(v) ? null : v;
}
function getEssence(value: string) {
  return value.split(/\s*;\s*/)[0];
}

export function extractMIMEType(headers: Headers) {
  let mimeType: string | null = null;
  const values = headers.get("content-type")?.split(/\s*,\s*/);
  if (!values) {
    throw new Error("missing content type");
  }
  for (const value of values) {
    const temporaryMimeType = contentType(value);
    if (!temporaryMimeType || getEssence(temporaryMimeType) === "*/*") {
      continue;
    }
    mimeType = temporaryMimeType;
  }
  if (mimeType == null) {
    throw new Error("missing content type");
  }
  return mimeType;
}

export function isHTMLMIMEType(
  value: string,
): value is `text/html${"" | `;${string}`}` {
  return getEssence(value) === "text/html";
}

export function isXMLMIMEType(
  value: string,
): value is `${string}${"/" | "+"}xml` {
  const essence = getEssence(value);
  return essence.endsWith("+xml") || essence === "text/xml" ||
    essence === "application/xml";
}

const decoder = new TextDecoder();

export function parseJSONFromBytes<T = any>(
  value: Uint8Array,
  fallback: T = null!,
): T {
  try {
    return JSONParse(decoder.decode(value));
  } catch {
    return fallback;
  }
}

export function appendBytes<AB extends ArrayBufferLike = ArrayBuffer>(
  ...bytes: Uint8Array<AB>[]
): Uint8Array<AB> {
  let length = 0;
  for (const b of bytes) {
    length += b.length;
  }
  const result = new Uint8Array(length) as Uint8Array<AB>;
  let offset = 0;
  for (const b of bytes) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

export enum State {
  UNSENT = 0,
  OPENED = 1,
  HEADERS_RECEIVED = 2,
  LOADING = 3,
  DONE = 4,
}

const NORMALIZED_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "DELETE",
  "OPTIONS",
  "PUT",
  "PATCH",
] as const;

const FORBIDDEN_METHODS = ["CONNECT", "TRACE", "TRACK"] as const;

type ForbiddenMethod = (typeof FORBIDDEN_METHODS)[number];

type NormalizedMethod = (typeof NORMALIZED_METHODS)[number];

export function isForbidden(method: string): method is ForbiddenMethod {
  return FORBIDDEN_METHODS.includes(method.toUpperCase() as ForbiddenMethod);
}

export function normalize(
  method: string,
  fallback: NormalizedMethod = "GET",
): NormalizedMethod {
  return NORMALIZED_METHODS.find(
    (m) => m === method.toUpperCase().trim(),
  ) || fallback;
}

// deno-lint-ignore ban-types
export function maybeDefine<
  T extends Function,
  K extends string,
  S extends object = $globalThis,
>(
  value: T,
  name: K,
  scope: S = $globalThis as S,
): asserts scope is S & { readonly [P in K]: T } {
  ObjectDefineProperty(value, "name", {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  if (!(name in scope)) {
    ObjectDefineProperty(scope, name, {
      value,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
}
