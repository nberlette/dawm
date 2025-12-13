<div align="center">

# dawm

<small>“<em> <b><u>WAS</u></b>M <b><u>D</u></b>ocument <b><u>O</u></b>bject
<b><u>M</u></b>odel </em>”</small>

---

**Portable high-speed [DOM] parser for HTML/XML written in [Rust],**\
<small>with a high-level TypeScript implementation of a DOM API subset,
suitable\
for use in any ES2015+ JavaScript runtime with [WebAssembly] support.</small>

---

</div>

## Introduction

**`dawm`** (pronounced _"wahz-dumb"_) is a portable toolkit for parsing,
manipulating, and serializing HTML and XML documents in a variety of JavaScript
environments. It consists of a hybrid codebase that combines a high-performance
[WebAssembly] parser backend (written in [Rust]), with a high-level TypeScript
API implementing a subset of the [Document Object Model (DOM)][DOM] standard.

## Usage

This package is distributed via [npm] and [jsr], and can be easily installed
into your project using your favorite package manager.

#### Installing from [npm]

```sh
deno add npm:dawm
```

### Installing from [JSR]

```sh
deno add jsr:@nick/dawm
```

```sh
pnpm add jsr:@nick/dawm
```

```sh
yarn add jsr:@nick/dawm
```

```sh
bunx jsr add @nick/dawm
```

```sh
npx jsr add @nick/dawm
```

##### Older versions of [PNPM] and [Yarn] without native-JSR support

```sh
pnpx jsr add @nick/dawm # or pnpm dlx jsr add @nick/dawm
```

```sh
yarn dlx jsr add @nick/dawm
```

---

### Import

```ts
import { parseHTML, type ParseOptions } from "@nick/dawm";
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

### Features

> [!TIP] Familiar API Surface
>
> Featuring TypeScript implementations of familiar DOM APIs like `Document`,
> `Element`, and `Attr`, this package provides a familiar developer experience
> with minimal learning curve.
>
> This saves you from having to learn another framework-specific API just to
> manipulate HTML/XML documents — if you've done any frontend web dev before,
> you can immediately start using `dawm` in your server-side workflows without
> missing a beat.

> [!IMPORTANT] High Performance
>
> At the core of `dawm` lies a blazing-fast HTML/XML parser written in [Rust]
> and compiled to [WebAssembly], capable of efficiently processing even large
> documents with ease. This ensures that your applications can handle heavy DOM
> manipulation tasks without breaking a sweat.

> [!CAUTION] Security First
>
> Running in a sandboxed WASM environment, `dawm` ensures that untrusted content
> cannot compromise the host application. Scripts are never executed as the
> parser automatically strips them out of the source document.

> [!WARNING] Standards Compliant
>
> Built on top of the `html5ever` crate created by [servo], the parser boasts
> full compliance with the HTML5 parsing algorithm as defined by the [WHATWG]
> specification.

> [!NOTE] Zero Dependencies
>
> Designed to be lightweight and portable, `dawm` comes with **zero** external
> dependencies.[^1] This makes it easy to integrate into any project without
> worrying about dependency conflicts or bloat.

> [!TIP] Polylingual and Portable
>
> The `dawm` parser is capable of parsing HTML, XML, SVG, and MathML documents,
> as well as HTML fragments. This makes it a versatile choice for a wide range
> of applications. Furthermore, it's designed to be highly portable and
> compatible with any modern WASM-friendly runtime, including **[Deno]**,
> **[Bun]**, **[Node]**, and **[Cloudflare Workers]**.

---

## Examples

> For more examples, check out the [`./examples`] directory on [GitHub].

### Basic HTML Parsing

```ts
import { Document, type ParseOptions } from "@nick/dawm";
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
import * as dom from "https://esm.sh/jsr/@nick/dawm?bundle&dts";
```

#### UMD Module

```html
<script src="https://esm.sh/jsr/@nick/dawm/global?bundle&dts"></script>
<script>
  const { dawm } = globalThis;

  const options = {
    contentType: "text/html", // default mime type
    exactErrors: false, // default error mode
    quirksMode: "no-quirks", // default quirks mode
    dropDoctype: false, // strip doctype from output
    iframeSrcdoc: false, // set to true when parsing iframe srcdoc contents
    scriptingEnabled: false, // set to true when scripting is enabled
  };

  const doc = dawm.parseHTML(
    "<!DOCTYPE html><html><body><h1>Hello, world!</h1></body></html>",
    options,
  );

  console.log(doc.root.firstChild.firstChild.textContent); // "Hello, world!"
</script>
```

---

<div align="center">

**[MIT] © [Nicholas Berlette]. All rights reserved.**

<small>

[jsr] · [npm] · [docs] · [github] · [issues] · [contributing]

</small></div>

[^1]: The only external package `dawm` relies on is [`parsel-js`] by Lea Verou,
    which is used to provide CSS selector support for the `querySelector[All]`
    APIs. For portability and convenience, we vendor, bundle, and inline its
    source code during the build process, resulting in a standalone,
    dependency-free package.

[`./examples`]: https://github.com/nberlette/dawm/tree/main/examples "Explore the dawm examples directory on GitHub!"
[Nicholas Berlette]: https://github.com/nberlette "Follow the author, Nicholas Berlette, on GitHub for more cool projects!"
[GitHub]: https://github.com/nberlette/dawm "Give the dawm project a star on GitHub! ⭐️"
[MIT]: https://nick.mit-license.org "MIT © 2025 Nicholas Berlette. All rights reserved."
[Contributing]: https://github.com/nberlette/dawm/blob/main/.github/CONTRIBUTING.md "Contributing to dawm"
[Issues]: https://github.com/nberlette/dawm/issues "Report issues or request features for dawm on GitHub"
[Docs]: https://jsr.io/@nick/dawm/doc "View the auto-generated API documentation on JSR.io"
[esm.sh]: https://esm.sh/jsr/@nick/dawm?bundle&dts "Import dawm as an ES module from esm.sh"
[jsr]: https://jsr.io/@nick/dawm "Import dawm as an ES module from JSR.io"
[npm]: https://www.npmjs.com/package/dawm "Install dawm from npm"
[Deno]: https://deno.land "Deno: A secure runtime for JavaScript and TypeScript"
[Bun]: https://bun.sh "Bun: A fast all-in-one JavaScript runtime"
[Node]: https://nodejs.org "Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine."
[Cloudflare Workers]: https://workers.cloudflare.com "Cloudflare Workers: Serverless functions that run on Cloudflare's global network"
[WebAssembly]: https://webassembly.org "WebAssembly: A new type of code that can be run in modern web browsers and other environments"
[DOM]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model "Document Object Model (DOM): A programming interface for HTML and XML documents"
[WHATWG]: https://whatwg.org "WHATWG: The Web Hypertext Application Technology Working Group"
[HTML5]: https://html.spec.whatwg.org/multipage/ "HTML5: The living standard for HTML maintained by the WHATWG"
[XML]: https://www.w3.org/XML/ "XML: eXtensible Markup Language"
[Rust]: https://www.rust-lang.org "Rust: A language empowering everyone to build reliable and efficient software"
[pnpm]: https://pnpm.io "pnpm: A fast, disk space efficient package manager"
[yarn]: https://yarnpkg.com "Yarn: A JavaScript package manager"
[`parsel-js`]: https://github.com/LeaVerou/parsel "parsel-js: A fast CSS selector engine in JavaScript"
