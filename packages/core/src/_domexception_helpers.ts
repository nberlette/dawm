/**
 * Mapping of legacy `DOMException` error names to their corresponding legacy
 * error codes. This is used internally by the `DOMException` ponyfill to
 * provide the `code` property for compatibility with older environments and
 * legacy APIs.
 *
 * It follows the standard mapping defined in the DOM spec, where each error
 * name corresponds to a specific numeric code that was historically used
 * before the introduction of error names.
 *
 * The `default` entry maps to 0, representing an unknown/unspecified error.
 *
 * @internal
 */
export const CODES = [
  null!, // placeholder for index 0 (unused)
  { id: 1, key: "INDEX_SIZE_ERR", name: "IndexSizeError" },
  { id: 2, key: "DOMSTRING_SIZE_ERR", name: "DOMStringSizeError" },
  { id: 3, key: "HIERARCHY_REQUEST_ERR", name: "HierarchyRequestError" },
  { id: 4, key: "WRONG_DOCUMENT_ERR", name: "WrongDocumentError" },
  { id: 5, key: "INVALID_CHARACTER_ERR", name: "InvalidCharacterError" },
  { id: 6, key: "NO_DATA_ALLOWED_ERR", name: "NoDataAllowedError" },
  {
    id: 7,
    key: "NO_MODIFICATION_ALLOWED_ERR",
    name: "NoModificationAllowedError",
  },
  { id: 8, key: "NOT_FOUND_ERR", name: "NotFoundError" },
  { id: 9, key: "NOT_SUPPORTED_ERR", name: "NotSupportedError" },
  { id: 10, key: "INUSE_ATTRIBUTE_ERR", name: "InUseAttributeError" },
  { id: 11, key: "INVALID_STATE_ERR", name: "InvalidStateError" },
  { id: 12, key: "SYNTAX_ERR", name: "SyntaxError" },
  { id: 13, key: "INVALID_MODIFICATION_ERR", name: "InvalidModificationError" },
  { id: 14, key: "NAMESPACE_ERR", name: "NamespaceError" },
  { id: 15, key: "INVALID_ACCESS_ERR", name: "InvalidAccessError" },
  { id: 16, key: "VALIDATION_ERR", name: "ValidationError" },
  { id: 17, key: "TYPE_MISMATCH_ERR", name: "TypeMismatchError" },
  { id: 18, key: "SECURITY_ERR", name: "SecurityError" },
  { id: 19, key: "NETWORK_ERR", name: "NetworkError" },
  { id: 20, key: "ABORT_ERR", name: "AbortError" },
  { id: 21, key: "URL_MISMATCH_ERR", name: "URLMismatchError" },
  { id: 22, key: "QUOTA_EXCEEDED_ERR", name: "QuotaExceededError" },
  { id: 23, key: "TIMEOUT_ERR", name: "TimeoutError" },
  { id: 24, key: "INVALID_NODE_TYPE_ERR", name: "InvalidNodeTypeError" },
  { id: 25, key: "DATA_CLONE_ERR", name: "DataCloneError" },
] as const;

export type CODES = typeof CODES;

/**
 * Returns the legacy error code for a given error name.
 *
 * @param name The error name or key corresponding to a DOMException error.
 * @returns The legacy error code, or 0 if the name is not recognized.
 * @internal
 */
export function getLegacyCode<
  K extends string | number = LegacyCode[LegacyCodeProperty],
>(name: K): GetLegacyField<K, "id"> {
  return getLegacyField(name, "id") || 0;
}

export type LegacyCode = CODES[number];
export type LegacyCodeProperty = keyof LegacyCode;

type IsNever<U, T = true, F = false> = [U] extends [never] ? T : F;

export function getLegacyField<
  K extends string | number = LegacyCode[LegacyCodeProperty],
  P extends LegacyCodeProperty = never,
>(input: K, field?: P): GetLegacyField<K, P> {
  for (let i = 1; i < CODES.length; i++) {
    const row = CODES[i];
    if (row.id === input || row.key === input || row.name === input) {
      if (field) return row[field] as never;
      return row.name as never;
    }
  }
  return undefined!;
}

export type GetLegacyField<
  K extends string | number = LegacyCode[LegacyCodeProperty],
  P extends LegacyCodeProperty = never,
> = {
  [N in keyof CODES]: N extends `${number}` ? (
      CODES[N] extends infer R extends LegacyCode
        ? [K] extends [R["id"]] | [R["key"]] | [R["name"]]
          ? IsNever<P, R["name"], R[P]>
        : never
        : never
    )
    : never;
}[keyof CODES];
