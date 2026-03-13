import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMImplementation } from "../../src/core/DOMImplementation.ts";

describe("core/DOMImplementation", () => {
  it("creates HTML documents with head/body", () => {
    const impl = new DOMImplementation();
    const doc = impl.createHTMLDocument("Title");
    assert.strictEqual(doc.documentElement?.tagName.toLowerCase(), "html");
    assert.ok(doc.head);
    assert.ok(doc.body);
  });

  it("creates XML documents", () => {
    const impl = new DOMImplementation();
    const doc = impl.createDocument("urn:ns", "root");
    assert.strictEqual(doc.documentElement?.tagName.toLowerCase(), "root");
  });
});
