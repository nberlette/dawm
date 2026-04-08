import { QuirksMode, type QuirksModeType } from "./types.ts";

/**
 * Dedicated container type for deprecated parsing options.
 *
 * @category Options
 * @deprecated
 */
export interface DeprecatedParseOptions {
  /** @deprecated Use {@linkcode allowScripts} instead. */
  scriptingEnabled?: boolean;
}

/**
 * Options for parsing HTML or XML content into a DOM Document.
 *
 * @category Options
 */
export interface ParseOptions extends DeprecatedParseOptions {
  /**
   * Whether to produce exact error messages and codes as defined by the HTML
   * specification, rather than simplified or generalized errors. This option
   * is primarily intended for testing and conformance purposes.
   *
   * @default {false}
   */
  exactErrors?: boolean | undefined;
  /**
   * Whether to allow `<noscript>` elements and their content to be parsed and
   * included in the document tree. By default `dawm` will remove `noscript`
   * nodes and their subtrees from the document; enabling this option preserves
   * such elements and their content as-is.
   *
   * **Note**: Enabling this option **does not** execute or process any
   * scripts. It simply affects how their related `<noscript>` elements are
   * handled and whether or not they are included in the resulting DOM tree.
   * All `script` elements are discarded by dawm's internal WebAssembly-based
   * parser, for security purposes, and will never reach the JS boundary to be
   * considered for further processing. This behavior will never change.
   *
   * @default {false}
   */
  allowScripts?: boolean | undefined;
  /**
   * Whether the content being parsed originated from an `<iframe>` element's
   * `srcDoc` attribute, which affects how certain elements and scripts are
   * handled during parsing.
   *
   * @default {false}
   */
  iframeSrcdoc?: boolean | undefined;
  /**
   * Whether to drop the `DOCTYPE` declaration from the parsed document, which
   * can affect the rendering mode (quirks vs standards) in browsers.
   *
   * @default {false}
   */
  dropDoctype?: boolean | undefined;
  /**
   * Sets the quirks mode for the parsed document, which affects how certain
   * elements are handled and rendered according to HTML specifications.
   *
   * - `"no-quirks"`: Standard mode with full compliance to HTML and CSS rules.
   * - `"limited-quirks"`: Partial quirks mode for compatibility with older
   *   content, affecting specific elements like tables and images.
   * - `"quirks"`: Full quirks mode emulating legacy browser behavior,
   *   impacting box model calculations and element rendering.
   *
   * If not specified, the parser will determine the appropriate mode based on
   * the document's DOCTYPE declaration and content.
   *
   * @default {"no-quirks"}
   */
  quirksMode?: QuirksModeType | QuirksMode | string | null | undefined;
  /**
   * MIME type of the content being parsed. Controls the parsing engine used.
   * Set to `"text/html"` to use the HTML parser, or `"image/svg+xml"` or
   * `"application/xml"` to use the XML parser.
   *
   * @default {"application/xml"}
   */
  contentType?: string | null | undefined;
  /**
   * The context element name to use when parsing a fragment, which affects how
   * certain elements are interpreted and nested within the fragment.
   *
   * This only affects the fragment parser API (see {@linkcode parseFragment}),
   * which requires a context element to be provided in order to ensure correct
   * behavior when reconstructing the fragment subtree.
   *
   * @default {undefined}
   * @see {@linkcode FragmentParseOptions} for more details.
   */
  contextElement?: string | null | undefined;
}

/**
 * Options for parsing a fragment of HTML or XML content into a DOM
 * DocumentFragment.
 *
 * @category Options
 */
export interface FragmentParseOptions extends ParseOptions {
  /**
   * The context element name to use when parsing a fragment, which affects how
   * certain elements are interpreted and nested within the fragment.
   *
   * For example, when parsing a fragment that contains `<td>` elements,
   * setting the context element to `"table"` ensures that the `<td>` elements
   * are correctly nested within a `<table>` structure.
   *
   * @default {null}
   */
  contextElement: string | null;
}

/**
 * Resolved parse options with all defaults applied.
 * @category Options
 * @tags Resolved
 */
export interface ResolvedParseOptions
  extends Required<Omit<ParseOptions, "scriptingEnabled">> {
  quirksMode: QuirksMode;
}

/**
 * Resolved fragment parse options with all defaults applied.
 * @category Options
 * @tags Resolved
 */
export interface ResolvedFragmentParseOptions extends ResolvedParseOptions {
  contextElement: string | null;
}

/**
 * Resolves various forms of parse options into a consistent structure with
 * default values applied.
 * @category Options
 * @tags Resolvers
 */
export function resolveParseOptions(
  options?: string | ParseOptions | null,
): ResolvedParseOptions {
  const resolved = {
    exactErrors: false,
    allowScripts: false,
    iframeSrcdoc: false,
    dropDoctype: false,
    quirksMode: QuirksMode.NoQuirks,
    contentType: "application/xml",
  } as ResolvedParseOptions;

  if (typeof options === "string") {
    options = { contentType: options };
  }

  if (typeof options?.exactErrors === "boolean") {
    resolved.exactErrors = options.exactErrors;
  }

  resolved.allowScripts = !!(
    options?.allowScripts || options?.scriptingEnabled || false
  );

  if (typeof options?.iframeSrcdoc === "boolean") {
    resolved.iframeSrcdoc = options.iframeSrcdoc;
  }

  if (typeof options?.dropDoctype === "boolean") {
    resolved.dropDoctype = options.dropDoctype;
  }

  if (options?.quirksMode != null) {
    const quirksMode = resolveQuirksMode(options.quirksMode);
    switch (quirksMode) {
      case "limited-quirks":
        resolved.quirksMode = QuirksMode.LimitedQuirks;
        break;
      case "quirks":
        resolved.quirksMode = QuirksMode.Quirks;
        break;
      default:
        resolved.quirksMode = QuirksMode.NoQuirks;
    }
  }

  if (typeof options?.contentType === "string") {
    resolved.contentType = options.contentType;
  }

  return resolved;
}

/**
 * Resolves fragment parse options, ensuring the context element is properly
 * handled.
 * @category Options
 * @tags Resolvers
 */
export function resolveFragmentOptions(
  options?: FragmentParseOptions | string | null,
): ResolvedFragmentParseOptions {
  if (typeof options === "string") {
    options = { contextElement: options };
  }

  const resolved = resolveParseOptions(
    options,
  ) as ResolvedFragmentParseOptions;

  if (options?.contextElement != null) {
    resolved.contextElement = options.contextElement;
  } else {
    resolved.contextElement = null;
  }

  return resolved;
}

/**
 * Resolves an untyped value (numeric, string, or nullish) into a normalized
 * {@linkcode QuirksModeType} string enum value. If no value can be resolved,
 * the default value `"no-quirks"` is returned instead.
 *
 * @param mode The raw quirks mode input value.
 * @returns a normalized {@linkcode QuirksModeType} string value.
 * @category Options
 * @tags Resolvers
 */
export function resolveQuirksMode(
  mode: number | string | null | undefined,
): QuirksModeType {
  if (typeof mode === "string") {
    mode = mode.toLocaleLowerCase().trim();
  }
  switch (mode) {
    case "quirks":
    case QuirksMode.Quirks:
      return "quirks";
    case "limited":
    case "limited-quirks":
    case "limitedquirks":
    case QuirksMode.LimitedQuirks:
      return "limited-quirks";
    default:
      return "no-quirks";
  }
}
