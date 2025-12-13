import { type Document, DocumentFragment } from "./dom.ts";
import {
  type FragmentParseOptions,
  normalizeFragmentOptions,
  normalizeParseOptions,
  type ParseOptions,
} from "./options.ts";
import { buildDocumentTree } from "./tree.ts";
import { parse_doc, parse_frag, parse_html, parse_xml } from "./wasm.ts";
import { toWireDoc } from "./wire.ts";

/**
 * Parses a string input into a {@linkcode Document} object, optionally using
 * the provided {@linkcode ParseOptions} to configure the parsing behavior.
 *
 * @param input The string input to parse into a Document.
 * @param [options] Optional parsing options to customize the behavior.
 * @returns The parsed Document object.
 */
export function parseDocument(
  input: string,
  options?: ParseOptions | null,
): Document;
/**
 * Parses a string into a {@linkcode Document} object, using the specified MIME
 * type and optional {@linkcode ParseOptions} to control the parsing behavior.
 * If the MIME type is not provided, it defaults to `"application/xml"`.
 *
 * @param input The string input to parse into a Document.
 * @param mimeType The MIME type to use for parsing (e.g., "text/html", "application/xml").
 * @param [options] Optional parsing options to customize the behavior.
 * @returns The parsed Document object.
 */
export function parseDocument(
  input: string,
  mimeType: string,
  options?: ParseOptions | null,
): Document;
/** @internal */
export function parseDocument(
  input: string,
  mimeTypeOrOptions?: string | ParseOptions | null,
  options?: ParseOptions | null,
): Document {
  if (typeof mimeTypeOrOptions === "string") {
    options = { contentType: mimeTypeOrOptions, ...options };
  } else {
    options = { ...mimeTypeOrOptions, ...options };
  }
  const normalized = normalizeParseOptions(options);
  const mime = normalized?.contentType ?? "application/xml";
  const wire = parse_doc(input, mime, normalized);
  return buildDocumentTree(toWireDoc(wire));
}

/**
 * Parses an HTML string into a {@linkcode Document} object, using optional
 * {@linkcode ParseOptions} to customize the parsing behavior. This function is
 * specifically designed to handle HTML content; if you need to parse XML/SVG
 * content, consider using the {@linkcode parseXML} function instead.
 *
 * @param input The HTML string to parse into a Document.
 * @param [options] Optional parsing options to customize the behavior.
 * @returns The parsed Document object.
 */
export function parseHTML(
  input: string,
  options?: ParseOptions | null,
): Document {
  const normalized = normalizeParseOptions(options);
  const wire = parse_html(input, normalized);
  return buildDocumentTree(toWireDoc(wire));
}

/**
 * Parses an XML string into a {@linkcode Document} object, using optional
 * {@linkcode ParseOptions} to customize the parsing behavior. This function is
 * specifically designed to handle XML/SVG content; if you need to parse HTML
 * content, consider using the {@linkcode parseHTML} function instead.
 *
 * @param input The XML string to parse into a Document.
 * @param [options] Optional parsing options to customize the behavior.
 * @returns The parsed Document object.
 */
export function parseXML(
  input: string,
  options?: ParseOptions | null,
): Document {
  const normalized = normalizeParseOptions(options);
  const wire = parse_xml(input, normalized);
  return buildDocumentTree(toWireDoc(wire));
}

/**
 * Parses a string fragment into a {@linkcode DocumentFragment} object, using
 * the provided {@linkcode FragmentParseOptions} to customize the parsing
 * behavior. If no context element is specified, the fragment is parsed in a
 * generic context. Alternatively, a specific context element name can be
 * provided to influence the parsing, such as `"div"` or `"span"`.
 *
 * @param input The string fragment to parse into a DocumentFragment.
 * @param options Optional fragment parsing options.
 * @returns The parsed DocumentFragment object.
 */
export function parseFragment(
  input: string,
  options: FragmentParseOptions | null,
): DocumentFragment;
/**
 * Parses a string fragment into a {@linkcode DocumentFragment} object, using
 * the specified context element name and optional {@linkcode FragmentParseOptions}
 * to customize the parsing behavior. The context element helps define the parsing
 * environment for the fragment, such as `"div"` or `"span"`, affecting how certain
 * elements are interpreted within the fragment.
 *
 * @param input The string fragment to parse into a DocumentFragment.
 * @param contextElement The name of the context element for parsing the fragment.
 * @param [options] Optional fragment parsing options.
 * @returns The parsed DocumentFragment object.
 */
export function parseFragment(
  input: string,
  contextElement: string,
  options?: ParseOptions | null,
): DocumentFragment;
/** @internal */
export function parseFragment(
  input: string,
  contextElement: string | FragmentParseOptions | null = null,
  options: ParseOptions | null = null,
): DocumentFragment {
  let opts: FragmentParseOptions;
  if (typeof contextElement === "string") {
    opts = { contextElement, ...options };
  } else {
    opts = { ...contextElement, ...options } as FragmentParseOptions;
  }
  const normalized = normalizeFragmentOptions(opts);
  const wire = parse_frag(input, normalized);
  const doc = buildDocumentTree(toWireDoc(wire));
  const fragment = new DocumentFragment();
  fragment.ownerDocument = doc;
  const container = doc.documentElement ?? doc.firstChild;
  if (container) {
    while (container.firstChild) {
      fragment.appendChild(container.removeChild(container.firstChild));
    }
  }
  return fragment;
}
