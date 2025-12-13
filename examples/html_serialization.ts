import { Document, type ParseOptions, serializeHTML } from "@nick/dawm";
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
const doc = Document.parseHTML(input, options);

assert.ok(doc?.head && doc.body);
assert.strictEqual(doc.doctype?.name, "html");
assert.strictEqual(doc.head?.nextSibling, doc.body);
assert.strictEqual(doc.title, "foobar");

const title = doc.head.firstElementChild;
assert.strictEqual(title?.textContent, doc.title);
title.textContent = "New Title";

const h1 = doc.body.firstElementChild;
assert.strictEqual(h1?.tagName, "H1");
assert.strictEqual(h1.textContent, "Hello, world!");
assert.strictEqual(h1.parentNode, doc.body);

// Manipulate the DOM a little bit
const p = doc.createElement("p");
p.textContent = "This is a new paragraph.";
doc.body.appendChild(p);

assert.notStrictEqual(doc.innerHTML, input);
assert.strictEqual(doc.body.lastElementChild, p);
assert.strictEqual(doc.body.children.length, 2);

// Serialize the document back to HTML
const html = serializeHTML(doc);

console.log(html);
// Output:
// <!DOCTYPE html><html><head><title>New Title</title></head><body><h1>Hello, world!</h1><p>This is a new paragraph.</p></body></html>
