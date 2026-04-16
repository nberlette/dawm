import { describe, it } from "node:test";
import { DOMImplementation } from "../../src/DOMImplementation.ts";
import { DOMParser } from "../../src/DOMParser.ts";
import { NodeType } from "../../src/types.ts";
import { parseFragment, parseHTML, parseXML } from "../../../dawm/src/parse.ts";
import { serializeHTML } from "../../../dawm/src/serialize.ts";
import {
  assertFixtureOutput,
  loadTextFixtures,
  parseJSONFixture,
  type TextFixture,
  toSnapshot,
} from "dawm-testing/fixtures";

interface DOMImplementationDoctypeFixture {
  name: string;
  publicId: string;
  systemId: string;
}

type CoreFixtureInput =
  | {
    kind: "parse-html";
    via?: "dom-parser" | "function";
    input: string;
  }
  | {
    kind: "parse-xml";
    via?: "dom-parser" | "function";
    contentType?:
      | "application/xml"
      | "text/xml"
      | "image/svg+xml"
      | "application/xhtml+xml";
    input: string;
  }
  | {
    kind: "parse-fragment";
    contextElement: string;
    input: string;
  }
  | {
    kind: "dom-implementation-html";
    title?: string | null;
  }
  | {
    kind: "dom-implementation-xml";
    namespaceURI: string | null;
    qualifiedName: string | null;
    doctype?: DOMImplementationDoctypeFixture;
  };

function collectElementNames(root: any): string[] {
  const names: string[] = [];
  const stack: any[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (
      node.nodeType === NodeType.Element && typeof node.localName === "string"
    ) {
      names.push(node.localName.toLowerCase());
    }
    const children: any[] = [];
    let child = node.firstChild;
    while (child) {
      children.push(child);
      child = child.nextSibling;
    }
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  return names;
}

function snapshotDocument(doc: any): string {
  return toSnapshot({
    compatMode: doc.compatMode,
    contentType: doc.contentType,
    documentElement: doc.documentElement?.localName?.toLowerCase() ?? null,
    elementNames: collectElementNames(doc),
    serialized: serializeHTML(doc),
    textContent: doc.documentElement?.textContent ?? "",
  });
}

function snapshotFragment(fragment: any, contextElement: string): string {
  let childNodes = 0;
  let child = fragment.firstChild;
  while (child) {
    childNodes++;
    child = child.nextSibling;
  }
  return toSnapshot({
    childNodes,
    contextElement,
    elementNames: collectElementNames(fragment),
    serialized: serializeHTML(fragment),
    textContent: fragment.textContent ?? "",
  });
}

function runFixture(fixture: TextFixture): string {
  const input = parseJSONFixture<CoreFixtureInput>(fixture);
  switch (input.kind) {
    case "parse-html": {
      const via = input.via ?? "function";
      const doc = via === "dom-parser"
        ? new DOMParser().parseFromString(input.input, "text/html")
        : parseHTML(input.input);
      return snapshotDocument(doc);
    }

    case "parse-xml": {
      const via = input.via ?? "function";
      const contentType = input.contentType ?? "application/xml";
      const doc = via === "dom-parser"
        ? new DOMParser().parseFromString(input.input, contentType)
        : parseXML(input.input, { contentType });
      return snapshotDocument(doc);
    }

    case "parse-fragment": {
      const fragment = parseFragment(input.input, input.contextElement);
      return snapshotFragment(fragment, input.contextElement);
    }

    case "dom-implementation-html": {
      const doc = new DOMImplementation().createHTMLDocument(input.title);
      return snapshotDocument(doc);
    }

    case "dom-implementation-xml": {
      const impl = new DOMImplementation();
      const doctype = input.doctype
        ? impl.createDocumentType(
          input.doctype.name,
          input.doctype.publicId,
          input.doctype.systemId,
        )
        : null;
      const doc = impl.createDocument(
        input.namespaceURI,
        input.qualifiedName,
        doctype,
      );
      return snapshotDocument(doc);
    }
  }
}

describe("core/fixtures", () => {
  const fixtures = loadTextFixtures("core", { extensions: [".json"] });
  for (const fixture of fixtures) {
    it(`matches fixture output: ${fixture.relPath}`, () => {
      const actual = runFixture(fixture);
      assertFixtureOutput(fixture, actual);
    });
  }
});
