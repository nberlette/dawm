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
import { DocumentType } from "./DocumentType.ts";
import { HTMLDocument } from "../html/HTMLDocument.ts";
import { XMLDocument } from "../xml/XMLDocument.ts";

/**
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation)
 */
export class DOMImplementation {
  createDocument(
    namespaceURI: string | null,
    qualifiedName: string | null,
    documentType?: DocumentType | null,
  ): XMLDocument {
    const doc = new XMLDocument();
    doc.namespaceURI = namespaceURI;
    qualifiedName ||= "";
    // @ts-ignore intentional readonly re-assignment
    doc.ownerDocument = null;
    if (documentType) {
      doc.appendChild(documentType);
    }
    const root = doc.createElementNS(namespaceURI ?? "", qualifiedName);
    doc.appendChild(root);
    return doc;
  }

  createDocumentType(
    name: string,
    publicId: string,
    systemId: string,
  ): DocumentType {
    return new DocumentType(name, publicId, systemId);
  }

  createHTMLDocument(title?: string | null): HTMLDocument {
    const doc = new HTMLDocument();

    // @ts-ignore intentional readonly re-assignment
    doc.ownerDocument = null;

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
}
