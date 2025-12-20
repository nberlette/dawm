<div align="center">

# [`dawm`]

**Portable high-speed [DOM] parser for HTML/XML written in [Rust],**\
<small>paired with a subset of DOM APIs implemented in TypeScript, suitable\
for use in any ES2015+ JavaScript runtime with [WebAssembly] support.</small>

---

</div>

## Introduction

**`dawm`** — _like **DOM**, but with **a** lil' **WebAssembly**_ — is a portable
toolkit for parsing, traversing, manipulating, and serializing HTML/SVG/XML code
in (usually) headless JavaScript environments. It features a hybrid codebase
combining a high-performance parser written in [Rust] with high-level
[Document Object Model (DOM)][DOM] standard APIs implemented in strict,
well-documented TypeScript.

The overall developer experience with `dawm` is uncannily familiar for anyone
with frontend development experience, making it adoptable by a vast majority of
developers with minimal friction and virtually zero overhead.

## Install

```sh
deno add npm:dawm
```

```sh
pnpm add dawm
```

```sh
yarn add dawm
```

```sh
bun add dawm
```

```sh
npm i dawm
```

## Usage

```ts
import { parseHTML, type ParseOptions } from "dawm";
import assert from "node:assert";

const options = {
  allowScripts: false, // preserves <noscript> hierarchy (default: false)
  contentType: "text/html", // use "application/xml" for XML parsing
  exactErrors: false, // default error handling mode
  quirksMode: "no-quirks", // default quirks mode
  dropDoctype: false, // strip doctype from output? (default: false)
  iframeSrcdoc: false, // set to true when parsing iframe srcdoc content
  contextElement: null, // default context element name (for fragments)
} satisfies ParseOptions;

const doc = parseHTML(
  "<!doctype html><html><body><h1>Hello, world!</h1></body></html>",
  options,
);

const h1 = doc.firstElementChild?.firstChild;
assert.strictEqual(h1?.tagName, "H1");
assert.strictEqual(h1.textContent, "Hello, world!");
assert.strictEqual(h1.parentNode, doc.body);
```

---

## Overview

The `dawm` project is ideal for use in server-side and edge compute scenarios
where performance and portability are paramount. Whether you're building an SSR
framework, a web scraper, or simply need a way to run unit tests for frontend
code without needing a full-blown DOM implementation like JSDOM, `dawm` is up to
any task you can throw at it.

Purpose-built for intensive data processing tasks in server-side and edge
compute scenarios, `dawm` is designed to be fast: both in the literal sense of
its performance, and in terms of how quickly it can be adopted and integrated
into your workflows.

### Features

#### Familiar API Surface

Featuring TypeScript implementations of familiar DOM APIs like `Document`,
`Element`, and `Attr`, this package provides a familiar developer experience
with minimal learning curve.

This saves you from having to learn another framework-specific API just to
manipulate HTML/XML documents — if you've done any frontend web dev before, you
can immediately start using `dawm` in your server-side workflows without missing
a beat.

#### High Performance

At the core of `dawm` lies a blazing-fast HTML/XML parser written in [Rust] and
compiled to [WebAssembly], capable of efficiently processing even large
documents with ease. This ensures that your applications can handle heavy DOM
manipulation tasks without breaking a sweat.

#### Security First

Running in a sandboxed WASM environment, `dawm` ensures that untrusted content
cannot compromise the host application. Scripts are never executed as the parser
automatically strips them out of the source document.

#### Standards Compliant

Built on top of the `html5ever` crate created by [servo], the parser boasts full
compliance with the HTML5 parsing algorithm as defined by the [WHATWG]
specification.

#### Zero Dependencies

Designed to be lightweight and portable, `dawm` comes with **zero** external
dependencies.[^1] This makes it easy to integrate into any project without
worrying about dependency conflicts or bloat.

#### Polylingual and Portable

The `dawm` parser is capable of parsing HTML, XML, SVG, and MathML documents, as
well as HTML fragments. This makes it a versatile choice for a wide range of
applications. Furthermore, it's designed to be highly portable and compatible
with any modern WASM-friendly runtime, including **[Deno]**, **[Bun]**,
**[Node]**, and **[Cloudflare Workers]**.

---

## Examples

> For more examples, check out the [`./examples`] directory on [GitHub].

### Basic HTML Parsing

```ts
import { Document, type ParseOptions } from "dawm";
import assert from "node:assert";

const options = {
  allowScripts: false, // preserves <noscript> hierarchy (default: false)
  contentType: "text/html", // use "application/xml" for XML parsing
  exactErrors: false, // default error handling mode
  quirksMode: "no-quirks", // default quirks mode
  dropDoctype: false, // strip doctype from output? (default: false)
  iframeSrcdoc: false, // set to true when parsing iframe srcdoc content
  contextElement: null, // default context element name (for fragments)
} satisfies ParseOptions;

const doc = Document.parseHTML(
  "<!doctype html><html><head><title>foobar</title></head>" +
    "<body><h1>Hello, world!</h1></body></html>",
  options,
);

assert.strictEqual(doc.title, "foobar");
assert.strictEqual(doc.head?.nextSibling, doc.body);
const title = doc.head.firstElementChild;
assert.strictEqual(title?.textContent, "foobar");

const h1 = doc.body?.firstElementChild;
assert.strictEqual(h1?.tagName, "H1");
assert.strictEqual(h1.textContent, "Hello, world!");
assert.strictEqual(h1.parentNode, doc.body);
```

### CDN Usage (via [esm.sh])

#### ES Module (recommended)

```ts ignore
import * as dom from "https://esm.sh/dawm?bundle&dts";
```

#### UMD Module

```html
<script src="https://esm.sh/dawm/global?bundle"></script>
<script>
  const { dawm } = globalThis;

  const options = {
    contentType: "text/html", // default mime type
    exactErrors: false, // default error mode
    quirksMode: "no-quirks", // default quirks mode
    dropDoctype: false, // strip doctype from output
    iframeSrcdoc: false, // set to true when parsing iframe srcdoc contents
    allowScripts: false, // set to true when scripting is enabled
  };

  const doc = dawm.parseHTML(
    "<!DOCTYPE html><html><body><h1>Hello, world!</h1></body></html>",
    options,
  );

  console.log(doc.root.firstChild.firstChild.textContent); // "Hello, world!"
</script>
```

---

## DOM APIs

The following is a **non-exhaustive** list of the implementation status of DOM
APIs in the current iteration of the `dawm` library. Items that are checked off
are fully implemented and functional; unchecked items are either on the roadmap
for future implementation, or were deemed out of scope for this library (those
items are noted as such).

### Core

- [x] [`Node`]<!-- -->[^2]
- [x] [`Element`]
- [x] [`Attr`]
- [x] [`CharacterData`]<!-- -->[^2]
- [x] [`Text`]
- [x] [`CDATASection`]
- [x] [`Comment`]
- [x] [`ProcessingInstruction`]
- [x] [`DocumentFragment`]
- [x] [`DocumentType`]
- [x] [`Document`]
- [ ] `Entity` (not implemented; legacy feature)
- [ ] `EntityReference` (not implemented; legacy feature)
- [ ] `Notation` (not implemented; legacy feature)

### Collections

- [x] [`NodeList`]<!-- -->[^3]
- [x] [`HTMLCollection`]<!-- -->[^4]
- [x] [`NamedNodeMap`]
- [x] [`DOMTokenList`]
- [x] [`DOMStringMap`]
- [ ] `StyleSheetList` (not yet implemented)
- [ ] `MediaList` (not yet implemented)

### Parsing

- [x] [`DOMParser`]
- [x] [`Document.parseHTML`]<!-- -->[^5]
- [x] [`Document.parseXML`]<!-- -->[^6]
- [x] [`Document.parseFragment`]<!-- -->[^6]
- [ ] `Element.setHTML` (not yet implemented)

### Serialization

- [x] [`XMLSerializer`]
- [x] [`Element.outerHTML`]
- [x] [`Element.innerHTML`]
- [ ] `Element.insertAdjacentHTML` (not yet implemented)
- [ ] `Element.getHTML` (not yet implemented)

### Traversal & Manipulation

#### `Node`

- [x] [`Node.appendChild`]
- [x] [`Node.removeChild`]

#### `Element`

- [x] [`Element.getElementsByClassName`]
- [x] [`Element.getElementsByTagName`]
- [x] [`Element.getElementsByTagNameNS`]
- [x] [`Element.querySelector`]
- [x] [`Element.querySelectorAll`]

#### `Document`

- [x] [`Document.getElementById`]
- [x] [`Document.getElementsByClassName`]
- [x] [`Document.getElementsByName`]
- [x] [`Document.getElementsByTagName`]
- [x] [`Document.getElementsByTagNameNS`]
- [x] [`Document.querySelector`]
- [x] [`Document.querySelectorAll`]

---

## API

You can import from the root `dawm` package or from the scoped module paths
shown below (e.g. `import { parseHTML } from "dawm/parse"`).

### `dawm/parse`

DOM-first helpers that wrap the low-level WebAssembly parser and return fully
hydrated tree instances.

#### `parseDocument`

###### Signature

```ts ignore
parseDocument(input: string, options?: ParseOptions | null): Document;
parseDocument(
  input: string,
  mimeType: string,
  options?: ParseOptions | null,
): Document;
```

###### Example

```ts
import { parseDocument } from "dawm";

const xml = `<note><to>Codex</to><from>dawm</from></note>`;
const doc = parseDocument(xml, "application/xml");
console.log(doc.documentElement?.nodeName); // "note"
```

#### `parseFragment`

###### Signature

```ts ignore
parseFragment(
  input: string,
  options: FragmentParseOptions | null,
): DocumentFragment;
parseFragment(
  input: string,
  contextElement: string,
  options?: ParseOptions | null,
): DocumentFragment;
```

###### Example

```ts
import { parseFragment } from "dawm/parse";

const frag = parseFragment("<li>Two</li>", "ul");
console.log(frag.firstChild?.textContent); // "Two"
```

#### `parseHTML`

###### Signature

```ts ignore
parseHTML(input: string, options?: ParseOptions | null): Document;
```

###### Example

```ts
import { parseHTML } from "dawm";

const doc = parseHTML("<!doctype html><html><body><h1>Hi</h1></body></html>");
console.log(doc.querySelector("h1")?.textContent); // "Hi"
```

#### `parseXML`

###### Signature

```ts ignore
parseXML(input: string, options?: ParseOptions | null): Document;
```

###### Example

```ts
import { parseXML } from "dawm/parse";

const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect width="10"/></svg>`;
const doc = parseXML(svg);
console.log(doc.documentElement?.nodeName); // "svg"
```

### `dawm/serialize`

Utilities for turning DOM nodes and collections back into strings.

#### `serializeHTML`

###### Signature

```ts ignore
serializeHTML<T extends Node | Attr>(node: T | ArrayLike<T> | Iterable<T>): string;
```

###### Example

```ts
import { parseHTML, serializeHTML } from "dawm";
import assert from "node:assert";

const html = "<!doctype html><p data-msg='hi'>Hello</p>";
const doc = parseHTML(html);
const out = serializeHTML(doc.body?.firstChild);
assert.strictEqual(out, '<p data-msg="hi">Hello</p>');
```

#### `serializeDOMStringMap`

Serializes a [`DOMStringMap`] into a string of valid HTML `data-*` attributes.

> [!NOTE]
>
> This is used internally by the higher-level serialization APIs, including
> [`Element.outerHTML`], [`Element.innerHTML`], and [`XMLSerializer`].

###### Signature

```ts ignore
serializeDOMStringMap(dataset: DOMStringMap): string;
```

###### Example

```ts
import { Document, serializeDOMStringMap } from "dawm";

const el = new Document().createElement("div");
el.dataset.helloWorld = "true";
console.log(serializeDOMStringMap(el.dataset)); // ' data-hello-world="true"'
```

#### `serializeNamedNodeMap`

Serializes a [`NamedNodeMap`] into a string of valid HTML/XML attributes.

> [!NOTE]
>
> This is used internally by the higher-level serialization APIs, including
> [`Element.outerHTML`], [`Element.innerHTML`], and [`XMLSerializer`].

###### Signature

```ts ignore
serializeNamedNodeMap(attrs: NamedNodeMap): string;
```

###### Example

```ts
import { parseHTML, serializeNamedNodeMap } from "dawm";

const doc = parseHTML("<div id='app' ariaHidden='false'></div>");
console.log(serializeNamedNodeMap(doc.firstElementChild!.attributes));
// ' id="app" aria-hidden="false"'
```

### `dawm/select`

CSS-selector utilities powered by the [`parsel-js`] engine, which is vendored
into this package for convenience and portability.[^1]

#### `querySelector`

###### Signature

```ts ignore
querySelector<T extends Node>(node: Node, selector: string): T | null;
```

###### Example

```ts
import { parseHTML, querySelector } from "dawm";

const doc = parseHTML("<section><h2 class='title'>Docs</h2></section>");
const heading = querySelector(doc, ".title");
console.log(heading?.textContent); // "Docs"
```

#### `querySelectorAll`

###### Signature

```ts ignore
querySelectorAll<T extends Node>(node: Node, selector: string): T[];
```

###### Example

```ts
import { parseHTML, querySelectorAll } from "dawm/select";

const doc = parseHTML("<ul><li>A</li><li>B</li></ul>");
const items = querySelectorAll(doc, "li");
console.log(items.map((n) => n.textContent)); // ["A", "B"]
```

#### `matches`

###### Signature

```ts ignore
matches(node: Node, selector: string): boolean;
```

###### Example

```ts
import { matches, parseHTML, querySelector } from "dawm";

const doc = parseHTML("<div id='app' class='card'></div>");
const el = querySelector(doc, "#app")!;
console.log(matches(el, ".card")); // true
```

#### `select`

###### Signature

```ts ignore
select(node: Node, match: Matcher, opts?: { single?: boolean }): Node[];
```

###### Example

```ts
import { type Matcher, parseHTML, select } from "dawm/select";

const doc = parseHTML("<main><p>One</p><p>Two</p></main>");
const paragraphs = select(doc, ((n) => n.nodeName === "P") as Matcher);
console.log(paragraphs.length); // 2
```

#### `walk`

###### Signature

```ts ignore
walk(
  node: Node,
  callback: (node: Node, parent?: Node | null, index?: number) => void | Promise<void>,
  parent?: Node | null,
): AsyncGenerator<Node, void, number>;
```

###### Example

```ts
import { parseHTML, walk } from "dawm/select";

const doc = parseHTML("<div><b>hi</b><i>there</i></div>");
for await (
  const node of walk(doc, async (_n) => {
    // async-safe traversal
  })
) {
  // nodes yielded in document order
}
```

#### `walkSync`

###### Signature

```ts ignore
walkSync(
  node: Node,
  callback: (node: Node, parent?: Node | null, index?: number) => void,
  parent?: Node | null,
): void;
```

###### Example

```ts
import { parseHTML, walkSync } from "dawm/select";

const doc = parseHTML("<div><b>hi</b><i>there</i></div>");
walkSync(doc, (node) => {
  if (node.nodeType === 1) console.log(node.nodeName);
});
// logs DIV, B, I
```

#### `traverseSync`

###### Signature

```ts ignore
traverseSync<TNode extends Node = Node, TParent extends Node | null = TNode | null>(
  node: Node,
  test: (node: Node, parent?: TParent, index?: number) => node is TNode,
  parent?: TParent,
): Generator<TNode, void, number>;
```

###### Example

```ts
import { parseHTML, traverseSync } from "dawm/select";

const doc = parseHTML("<ul><li>A</li><li>B</li></ul>");
for (const li of traverseSync(doc, (n): n is Element => n.nodeName === "LI")) {
  console.log(li.textContent);
}
```

#### `specificity`

###### Signature

```ts ignore
specificity(selector: string): number;
```

###### Example

```ts
import { specificity } from "dawm/select";

const score = specificity("#app .card > h2");
console.log(score); // numeric specificity score
```

#### Default export

The `./select` entrypoint default-exports `querySelectorAll` for convenience:

###### Signature

```ts ignore
import querySelectorAll from "dawm/select";
```

### `dawm/options`

Helpers for normalizing parser options.

#### `normalizeParseOptions`

###### Signature

```ts ignore
normalizeParseOptions(options?: string | ParseOptions | null): NormalizedParseOptions;
```

###### Example

```ts
import { normalizeParseOptions } from "dawm/options";

const opts = normalizeParseOptions({
  allowScripts: true,
  contentType: "text/html",
});
console.log(opts.quirksMode); // "no-quirks" (defaulted)
```

#### `normalizeFragmentOptions`

###### Signature

```ts ignore
normalizeFragmentOptions(
  options?: FragmentParseOptions | string | null,
): NormalizedFragmentParseOptions;
```

###### Example

```ts
import { normalizeFragmentOptions } from "dawm/options";

const opts = normalizeFragmentOptions({ contextElement: "template" });
console.log(opts.contextElement); // "template"
```

### `dawm/types`

Runtime enums and aliases re-exported from the DOM layer.

#### `NodeType`, `QuirksMode`, `QuirksModeType`

```ts
import { NodeType, QuirksMode, type QuirksModeType } from "dawm/types";

const elementNode = NodeType.Element; // 1
const quirks: QuirksModeType = QuirksMode.NoQuirks; // "no-quirks"
```

### Advanced APIs

The modules below expose low-level APIs for advanced users, library authors, and
contributors looking to build on top of `dawm`. You probably won't need to use
these directly in most scenarios.

> The data returned from most of these functions is "dehydrated" and requires
> secondary string-resolution and linking steps via [`resolveStrings`] and
> [`buildSubtree`] or [`buildDocumentTree`].

[`buildSubtree`]: #buildsubtree
[`buildDocumentTree`]: #builddocumenttree
[`resolveStrings`]: #resolvestrings

#### `dawm/wasm`

Low-level WebAssembly bindings for the Rust-based HTML and XML parsers.

###### Signature

```ts ignore
parse_doc(input: string, mime: string, options?: object | null): WireDoc;
parse_html(input: string, options?: object | null): WireDoc;
parse_xml(input: string, options?: object | null): WireDoc;
parse_frag(input: string, options: object): WireDoc;
```

> [!WARNING]
>
> These return raw "wire" structures that are not optimized for human-usability.
> Unless you know what you're doing and have a specific reason to use these
> APIs, you'd probably be better off with higher-level `parse*` APIs instead.

###### Example

```ts
import { buildDocumentTree, dawm, toWireDoc } from "dawm";

const wire = dawm.parse_html("<em>raw</em>", null);
const doc = buildDocumentTree(toWireDoc(wire));
console.log(doc.body?.firstChild?.nodeName); // "EM"
```

#### `dawm/tree`

Utilities for turning raw WASM parser output into DOM objects (and vice versa).

##### `buildDocumentTree`

###### Signature

```ts ignore
buildDocumentTree(document: WireDoc): Document;
```

###### Example

```ts
import { buildDocumentTree, dawm, toWireDoc } from "dawm";

const wire = dawm.parse_html("<p>Hi</p>", null);
const doc = buildDocumentTree(toWireDoc(wire));
console.log(doc.body?.firstChild?.textContent); // "Hi"
```

##### `buildSubtree`

###### Signature

```ts ignore
buildSubtree(
  node: WireNode | ResolvedWireNode,
  parent?: Node | null,
  prev?: Node | null,
  next?: Node | null,
  context?: { /* internal tree-building context */ },
): Node;
```

###### Example

```ts
import { buildSubtree, resolveStrings } from "dawm/tree";
import { type WireNode } from "dawm/wire";

const wireNode: WireNode = {
  id: 1,
  nodeType: 1,
  nodeName: 0,
  nodeValue: null,
  parentNode: null,
  firstChild: null,
  nextSibling: null,
  attributes: [],
};
const strings = ["div"];
const resolved = resolveStrings(wireNode, strings);
const element = buildSubtree(resolved, null);
console.log(element.nodeName); // "div"
```

##### `resolveQuirksMode`

###### Signature

```ts ignore
resolveQuirksMode(mode: number | string | null | undefined): QuirksModeType;
```

###### Example

```ts
import { resolveQuirksMode } from "dawm/tree";

console.log(resolveQuirksMode("limited-quirks")); // "limited-quirks"
```

#### `dawm/wire`

Type guards and helpers for working with the serialized "wire" structures.

##### `resolveStrings`

###### Signature

```ts ignore
resolveStrings(node: WireDoc): ResolvedWireDoc;
resolveStrings(node: WireNode, strings: string[]): ResolvedWireNode;
resolveStrings(node: WireAttr, strings: string[]): ResolvedWireAttr;
```

###### Example

```ts
import { resolveStrings } from "dawm/tree";

const resolved = resolveStrings({
  contentType: "text/html",
  quirksMode: 2,
  strings: ["", "html", "class", "data-value", "w-screen h-screen"],
  nodes: [{
    id: 1,
    nodeType: 9,
    nodeName: 1,
    nodeValue: null,
    attributes: [{ name: 2, value: 4 }, { name: 3, value: 0 }],
  }],
});

console.log(resolved.nodes[0].nodeName); // "html"
```

##### `toWireDoc`

Converts an unknown value into a `WireDoc`, throwing if the value does not
conform to the expected shape. This is useful (and used internally) for ensuring
type safety when dealing with raw parser output.

###### Signature

```ts ignore
toWireDoc(value: unknown): WireDoc;
```

###### Example

```ts
import { dawm, toWireDoc } from "dawm";

const wire = dawm.parse_html("<p>Wire</p>", null);
// throws if the parser returned an unexpected shape
const safe = toWireDoc(wire);
```

##### Guard functions

```ts ignore
isWireDoc(value: unknown): value is WireDoc;
isWireNode(value: unknown): value is WireNode;
isWireAttr(value: unknown): value is WireAttr;
isResolvedWireDoc(value: unknown): value is ResolvedWireDoc;
isResolvedWireNode(value: unknown): value is ResolvedWireNode;
isResolvedWireAttr(value: unknown): value is ResolvedWireAttr;
isNodeLike(value: unknown): value is NodeLike;
```

###### Example

```ts
import { isNodeLike, isWireDoc } from "dawm/guards";

function inspect(value: unknown) {
  if (isWireDoc(value)) console.log("wire document");
  else if (isNodeLike(value)) console.log("dom-like node");
}
```

[^1]: The only external package `dawm` relies on is [`debrotli`], for
    decompressing the brotli-compressed WebAssembly binary. It also vendors
    [`parsel-js`] by Lea Verou, which is used to provide CSS selector support
    for the `querySelector{,All}` APIs. For portability and convenience, we
    vendor, bundle, and inline its source code during the build process,
    resulting in a standalone, dependency-free package.

[^2]: Abstract superclass; cannot be instantiated directly.

[^3]: Both static and living `NodeList`s are supported; per the DOM spec,
    `querySelectorAll` returns a static `NodeList`, while stateful methods like
    `childNodes` and `Element.getElementsByTagName` return live collections.

[^4]: All `HTMLCollection`s are live collections as per the DOM spec.

[^5]: Semi-standard implementation of the `Document.parseHTML` method, but
    without support for the same options as the standard API. Notably, this
    implementation does not support the sanitization options found in the
    standard DOM API; however, `dawm` always strips `<script>` elements from
    parsed documents.

[^6]: Non-standard extension.

[`NodeList`]: https://developer.mozilla.org/en-US/docs/Web/API/NodeList
[`HTMLCollection`]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection
[`NamedNodeMap`]: https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap
[`DOMTokenList`]: https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList
[`DOMStringMap`]: https://developer.mozilla.org/en-US/docs/Web/API/DOMStringMap
[`Node`]: https://developer.mozilla.org/en-US/docs/Web/API/Node
[`Element`]: https://developer.mozilla.org/en-US/docs/Web/API/Element
[`Attr`]: https://developer.mozilla.org/en-US/docs/Web/API/Attr
[`CharacterData`]: https://developer.mozilla.org/en-US/docs/Web/API/CharacterData
[`Text`]: https://developer.mozilla.org/en-US/docs/Web/API/Text
[`CDATASection`]: https://developer.mozilla.org/en-US/docs/Web/API/CDATASection
[`Comment`]: https://developer.mozilla.org/en-US/docs/Web/API/Comment
[`ProcessingInstruction`]: https://developer.mozilla.org/en-US/docs/Web/API/ProcessingInstruction
[`DocumentFragment`]: https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment
[`DocumentType`]: https://developer.mozilla.org/en-US/docs/Web/API/DocumentType
[`Document`]: https://developer.mozilla.org/en-US/docs/Web/API/Document
[`Document.parseHTML`]: #parsehtml "Document.parseHTML (semi-standard)"
[`Document.parseXML`]: #parsexml "Document.parseXML (non-standard)"
[`Document.parseFragment`]: #parsefragment "Document.parseFragment (non-standard)"
[`Document.getElementById`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
[`Document.getElementsByClassName`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
[`Document.getElementsByName`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByName
[`Document.getElementsByTagName`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByTagName
[`Document.getElementsByTagNameNS`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByTagNameNS
[`Document.querySelector`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
[`Document.querySelectorAll`]: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
[`Node.appendChild`]: https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
[`Node.removeChild`]: https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild
[`Element.outerHTML`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/outerHTML
[`Element.innerHTML`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
[`Element.getElementsByClassName`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
[`Element.getElementsByTagName`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
[`Element.getElementsByTagNameNS`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagNameNS
[`Element.querySelector`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector
[`Element.querySelectorAll`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelectorAll
[`Element.insertAdjacentHTML`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
[`Element.getHTML`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getHTML
[`DOMParser`]: https://developer.mozilla.org/en-US/docs/Web/API/DOMParser
[`XMLSerializer`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLSerializer

---

<div align="center">

**[MIT] © [Nicholas Berlette]. All rights reserved.**

<small>

[github] · [issues] · [jsr] · [npm] · [docs] · [contributing]

</small></div>

[`./examples`]: https://github.com/nberlette/dawm/tree/main/examples "Explore the dawm examples directory on GitHub!"
[Nicholas Berlette]: https://github.com/nberlette "Follow @nberlette on GitHub for more cool projects!"
[GitHub]: https://github.com/nberlette/dawm "Give the nberlette/dawm project a star on GitHub! ⭐️"
[`dawm`]: https://github.com/nberlette/dawm "Give the nberlette/dawm project a star on GitHub! ⭐️"
[MIT]: https://nick.mit-license.org "MIT © 2025 Nicholas Berlette. All rights reserved."
[Contributing]: https://github.com/nberlette/dawm/blob/main/.github/CONTRIBUTING.md "Contributing to dawm"
[Issues]: https://github.com/nberlette/dawm/issues "Report issues or request features for dawm on GitHub"
[Docs]: https://jsr.io/@nick/dawm/doc "View the auto-generated API documentation on JSR.io"
[esm.sh]: https://esm.sh/dawm?bundle&dts "Import dawm as an ES module from esm.sh"
[jsr]: https://jsr.io/@nick/dawm "Import dawm as an ES module from JSR.io"
[npm]: https://www.npmjs.com/package/dawm "Install dawm from npm"
[Deno]: https://deno.land "Deno: A secure runtime for JavaScript and TypeScript"
[Bun]: https://bun.sh "Bun: A fast all-in-one JavaScript runtime"
[Node]: https://nodejs.org "Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine."
[Cloudflare Workers]: https://workers.cloudflare.com "Cloudflare Workers: Serverless functions that run on Cloudflare's global network"
[WebAssembly]: https://webassembly.org "WebAssembly: A new type of code that can be run in modern web browsers and other environments"
[DOM]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model "Document Object Model (DOM): A programming interface for HTML and XML documents"
[WHATWG]: https://whatwg.org "WHATWG: The Web Hypertext Application Technology Working Group"
[Rust]: https://www.rust-lang.org "Rust: A language empowering everyone to build reliable and efficient software"
[`parsel-js`]: https://github.com/LeaVerou/parsel "parsel-js: A fast CSS selector engine in JavaScript"
[`debrotli`]: https://npmjs.com/package/debrotli "debrotli: WebAssembly brotli decoder with near-native performance"
