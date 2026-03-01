import type { ParseOptions } from "../options.ts";
import type { Document } from "./Document.ts";
import type { HTMLDocument } from "../html/HTMLDocument.ts";
import type { XMLDocument } from "../xml/XMLDocument.ts";
import { parseHTML, parseXML } from "../parse.ts";

/**
 * Represents a DOM Parser as defined by the DOM Standard.
 *
 * This class provides a single method, `parseFromString`, which allows parsing
 * of strings containing markup in various formats (HTML, XML, SVG) into a new
 * {@linkcode Document} instance.
 *
 * As a non-standard extension, this class also allows a custom options object
 * to be passed to the class constructor. All subsequent calls to the method
 * `parseFromString` will use the options set at construction time, which can
 * be used to set a default `contentType`, control the compatibility/quirks
 * mode of the HTML parser, and more. See the {@linkcode ParseOptions} docs for
 * more details.
 */

export class DOMParser {
  #options: ParseOptions | undefined;

  constructor(options?: ParseOptions) {
    this.#options = options;
  }

  parseFromString(html: string, contentType: "text/html"): HTMLDocument;
  parseFromString(svg: string, contentType: "image/svg+xml"): XMLDocument;
  parseFromString(
    xml: string,
    contentType: "application/xml" | "text/xml" | "application/xhtml+xml",
  ): XMLDocument;
  parseFromString(str: string, contentType?: string): Document;
  parseFromString(str: string, contentType: string): Document {
    if (contentType === "text/html") {
      return parseHTML(str, { ...this.#options, contentType });
    } else if (
      contentType === "image/svg+xml" ||
      contentType === "application/xml" ||
      contentType === "text/xml" ||
      contentType === "application/xhtml+xml"
    ) {
      return parseXML(str, { ...this.#options, contentType });
    } else if (!contentType) {
      return parseHTML(str, { ...this.#options, contentType: "text/html" });
    } else {
      throw new TypeError(`Unsupported content type: ${contentType}`);
    }
  }
}
