import { QuirksMode, type QuirksModeType } from "./dom.ts";
import { resolveQuirksMode } from "./tree.ts";

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
   * @internal
   */
  exactErrors?: boolean | undefined;
  /**
   * Whether to allow `<script>` and `<noscript>` elements and their content
   * to be parsed and included in the document tree.
   *
   * **Note**: Enabling this option **does not** execute or process any
   * scripts. It simply affects how their related `<noscript>` elements are
   * handled and whether or not they are included in the resulting DOM tree.
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
   * Whether to drop the DOCTYPE declaration from the parsed document, which
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
   * This is only applicable when parsing fragments, not full documents. When
   * using the {@linkcode parseFragment} function, a context element **must**
   * be provided to ensure correct parsing behavior.
   *
   * @default {undefined}
   * @see {@linkcode FragmentParseOptions} for more details.s
   */
  contextElement?: string | null | undefined;
}

/**
 * Dedicated container type for deprecated parsing options.
 *
 * @category Options
 * @internal
 */
interface DeprecatedParseOptions {
  /** @deprecated Use {@linkcode allowScripts} instead. */
  scriptingEnabled?: boolean;
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

export interface NormalizedParseOptions
  extends Required<Omit<ParseOptions, "scriptingEnabled">> {
  quirksMode: QuirksMode;
}

export interface NormalizedFragmentParseOptions extends NormalizedParseOptions {
  contextElement: string | null;
}

export function normalizeParseOptions(
  options?: string | ParseOptions | null,
): NormalizedParseOptions {
  const normalized = {
    exactErrors: false,
    allowScripts: false,
    iframeSrcdoc: false,
    dropDoctype: false,
    quirksMode: QuirksMode.NoQuirks,
    contentType: "application/xml",
  } as NormalizedParseOptions;

  if (typeof options === "string") {
    options = { contentType: options };
  }

  if (typeof options?.exactErrors === "boolean") {
    normalized.exactErrors = options.exactErrors;
  }
  const scripting = typeof options?.scriptingEnabled === "boolean"
    ? options.scriptingEnabled
    : typeof options?.allowScripts === "boolean"
    ? options.allowScripts
    : undefined;
  if (typeof scripting === "boolean") {
    normalized.allowScripts = scripting;
  }
  if (typeof options?.iframeSrcdoc === "boolean") {
    normalized.iframeSrcdoc = options.iframeSrcdoc;
  }
  if (typeof options?.dropDoctype === "boolean") {
    normalized.dropDoctype = options.dropDoctype;
  }
  if (options?.quirksMode != null) {
    const quirksMode = resolveQuirksMode(options.quirksMode);
    switch (quirksMode) {
      case "limited-quirks":
        normalized.quirksMode = QuirksMode.LimitedQuirks;
        break;
      case "quirks":
        normalized.quirksMode = QuirksMode.Quirks;
        break;
      default:
        normalized.quirksMode = QuirksMode.NoQuirks;
    }
  }
  if (typeof options?.contentType === "string") {
    normalized.contentType = options.contentType;
  }
  return normalized;
}

export function normalizeFragmentOptions(
  options?: FragmentParseOptions | string | null,
): NormalizedFragmentParseOptions {
  if (typeof options === "string") {
    options = { contextElement: options };
  }
  const normalized = normalizeParseOptions(
    options,
  ) as NormalizedFragmentParseOptions;
  if (options?.contextElement != null) {
    normalized.contextElement = options.contextElement;
  } else {
    normalized.contextElement = null;
  }
  return normalized;
}
