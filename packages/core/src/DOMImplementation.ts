/**
 * @module DOMImplementation
 *
 * This module exposes the {@linkcode DOMImplementation} interface, which is
 * the type of the {@linkcode Document.implementation} property, allowing for
 * programmatic creation of {@linkcode Document}, {@linkcode DocumentType}, and
 * {@linkcode HTMLDocument} instances.
 *
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation)
 */
import { _ } from "dawm-internal";
import {
  type HTMLDocument,
  HTMLDocument as HTMLDocumentClass,
  type XMLDocument,
  XMLDocument as XMLDocumentClass,
} from "./Document.ts";
import { DocumentType } from "./DocumentType.ts";

declare module "dawm-internal" {
  export interface DOMImplementationInternal {
    new: () => DOMImplementation;
  }

  export interface internal {
    DOMImplementation: DOMImplementationInternal;
  }
}

/**
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation)
 */
export class DOMImplementation {
  createDocument(
    namespaceURI: string | null,
    qualifiedName: string | null,
    documentType?: DocumentType | null,
  ): XMLDocument {
    const doc = _.Document.create(
      XMLDocumentClass,
      "application/xml",
      "no-quirks",
      namespaceURI,
    );
    qualifiedName ||= "";
    if (documentType) doc.appendChild(documentType);
    const root = doc.createElementNS(namespaceURI ?? "", qualifiedName);
    doc.appendChild(root);
    return doc;
  }

  createDocumentType(
    name: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    return _.DocumentType.new(name, publicId, systemId);
  }

  createHTMLDocument(title?: string | null): HTMLDocument {
    const doc = _.Document.create(
      HTMLDocumentClass,
      "text/html",
      "no-quirks",
      _.constants.XHTML_NAMESPACE,
    );

    const type = doc.createDocumentType("html", "", "");
    doc.appendChild(type);

    const html = doc.createElement("html");
    html.setAttribute("lang", "en-US");
    doc.appendChild(html);

    const head = doc.createElement("head");
    if (title) {
      const titleElement = doc.createElement("title");
      titleElement.textContent = title;
      head.appendChild(titleElement);
    }

    const meta = doc.createElement("meta");
    meta.setAttribute("charset", "UTF-8");
    head.appendChild(meta);
    html.appendChild(head);

    const body = doc.createElement("body");
    html.appendChild(body);

    return doc;
  }

  static {
    _.DOMImplementation = {
      new: () => new DOMImplementation(),
    };
  }
}
