/* tslint:disable */
/* eslint-disable */

export enum NodeType {
  Element = 1,
  Attribute = 2,
  Text = 3,
  CData = 4,
  EntityReference = 5,
  Entity = 6,
  ProcessingInstruction = 7,
  Comment = 8,
  Document = 9,
  DocumentType = 10,
  DocumentFragment = 11,
  Notation = 12,
}

/**
 * Represents the HTML quirks mode to use during parsing.
 *
 * `QuirksMode` determines how the parser handles certain legacy behaviors
 * and rendering quirks that were present in older browsers. The mode can be
 * set to one of three options:
 *
 * - `QuirksMode.Quirks` (`"quirks"`): Enables full quirks mode, emulating
 *   older browser behavior for maximum compatibility with legacy content.
 * - `QuirksMode.LimitedQuirks` (`"limited-quirks"`): Enables a limited portion
 *   of quirks mode, emulating _some_ legacy behaviors while still adhering to
 *   modern standards in key areas.
 * - `QuirksMode.NoQuirks` (`"no-quirks"`, default): Disables quirks mode
 *   entirely, ensuring the parser strictly follows modern HTML standards and
 *   behaves consistently with contemporary browsers.
 */
export enum QuirksMode {
  Quirks = 0,
  LimitedQuirks = 1,
  NoQuirks = 2,
}

/**
 * Parses a given input string as either an HTML or XML-like document,
 * returning a serialized representation of the [`RcDom`] structure. The
 * `mime` parameter determines whether to parse as HTML or XML-like. The
 * optional `options` parameter allows customization of parsing behavior, such
 * as quirks mode, error handling, and content type, among others.
 *
 * Note that the returned structure is **flat**. To obtain a hierarchical tree
 * structure that reflects parent-child relationships within the DOM, the
 * returned data should first have all its numeric string indices resolved to
 * actual strings (via the `.strings` array), followed by its nodes being
 * resolved into a tree based on parent-child and sibling relationships.
 *
 * As with the strings, node hierarchies are represented using integer indices
 * that need to be resolved relative to the `.nodes` array.
 */
export function parse_doc(input: string, mime: string, options?: object | null): any;

/**
 * Parses a given input string as an HTML fragment within the context of a
 * specified element, returning a serialized representation of the [`RcDom`]
 * structure. The node structure will require further processing to build a
 * tree and resolve string references.
 *
 * @see {@linkcode parse_html} for parsing full HTML documents.
 */
export function parse_frag(input: string, options: any): any;

/**
 * Parses a given input string as an HTML document, returning a serialized
 * representation of the [`RcDom`] structure. The node structure will require
 * further processing to build a tree and resolve string references.
 *
 * @see {@linkcode parse_frag} for parsing HTML fragments.
 * @see {@linkcode parse_xml} for parsing XML-like documents.
 */
export function parse_html(input: string, options?: object | null): any;

/**
 * Parses a given input string as an XML-like document (XML, SVG, XHTML),
 * returning a serialized representation of the [`RcDom`] structure. The
 * node structure will require further processing to build a tree and resolve
 * string references.
 *
 * @see {@linkcode parse_html} for parsing HTML documents.
 * @see {@linkcode parse_frag} for parsing HTML fragments.
 */
export function parse_xml(input: string, options: any): any;
