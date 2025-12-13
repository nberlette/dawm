import { Document, type ParseOptions } from "@nick/dawm";
import assert from "node:assert";

const options = {
  allowScripts: false, // preserves <noscript> hierarchy (default: false)
  contentType: "text/html", // use "application/xml" for XML parsing
  exactErrors: false, // default error handling mode
  quirksMode: "no-quirks", // default quirks mode
  dropDoctype: false, // strip doctype from output? (default: false)
  iframeSrcdoc: false, // set to true when parsing iframe srcdoc content
} satisfies ParseOptions;

const input = `<!doctype html><html><head><title>foobar</title></head><body>` +
  `<h1>Hello, world!</h1></body></html>`;

// Document.parseHTML is a convenience method for parsing HTML content, which
// sets sensible defaults for HTML parsing. Internally it calls the parseHTML
// function exposed by the wasmdom
const doc = Document.parseHTML(input, options);

assert.ok(doc?.head && doc.body);
assert.strictEqual(doc.doctype?.name, "html");
assert.strictEqual(doc.head.nextSibling, doc.body);

const title = doc.head.firstElementChild;
assert.strictEqual(title?.textContent, doc.title);
assert.strictEqual(title.tagName, "TITLE");
assert.strictEqual(title, "foobar");

const h1 = doc.body.firstElementChild;
assert.strictEqual(h1?.tagName, "H1");
assert.strictEqual(h1.textContent, "Hello, world!");
assert.strictEqual(h1.parentNode, doc.body);

assert.strictEqual(doc.body.children.length, 1);
