# `dawm-xhr`

The [`dawm-xhr`] package provides a runtime-agnostic implementation of several
standard [`XMLHttpRequest`] APIs, allowing asynchronous HTTP requests within the
context of a _headless DOM environment_[^1].

> [!NOTE]
>
> This module's main purpose is to enable the fetching of external resources
> such as HTML documents and CSS stylesheets in the dawm package architecture,
> but it can also be used as a general-purpose client for making HTTP requests.

[^1]: [dawm] is built to enrich server-side runtime environments with many of
    the standard DOM APIs that typically reside in web browsers. Since there's
    no actual browser _window_ (i.e., no visual rendering engine/context) in the
    environments dawm primarily targets, we refer to them as "headless".

---

## API

### [`XMLHttpRequest`]

```ts
import { XMLHttpRequest } from "dawm-xhr";

const xhr = new XMLHttpRequest();
const url = "https://jsonplaceholder.typicode.com/posts/1";

xhr.open("GET", url);
xhr.onload = () => {
  if (xhr.status === 200) {
    console.log("Response (JSON):", xhr.responseText);
  } else {
    console.error("Request failed with status:", xhr.status);
  }
};
xhr.onerror = () => {
  console.error("Network error occurred");
};
xhr.send();
```

#### Automatic Document Parsing

Unlike the original `xhr` ponyfill, [`dawm-xhr`]'s `XMLHttpRequest`
implementation has been enhanced and integrated with the [`XMLDocument`]
implementation from its sibling package, [`dawm-xml`].

This allows the `"document"` response type to be used in the same way as the
standard `XMLHttpRequest` implementation found in web browsers, for a one-step
fetch-and-parse workflow of HTML/XML documents and fragments.

```ts
import { XMLHttpRequest } from "dawm-xhr";
import type { XMLDocument } from "dawm-xml";
import assert from "node:assert";

// Example URL pointing to an HTML document. in this case, the homepage of
// the F1 project of mine from 2023 (scraper of construction site live feeds
// during the Las Vegas Grand Prix track's build process).
const url = "https://f1.berlette.com/index.html";

const xhr = new XMLHttpRequest();
xhr.open("GET", url);
xhr.responseType = "document";
xhr.onload = () => {
  if (xhr.status === 200) {
    const doc: XMLDocument = xhr.response;

    // we can directly work with the parsed document here!
    assert.strictEqual(doc?.documentElement?.tagName, "HTML");

    // for example, rounding up all the images in the document:
    const images = doc.querySelectorAll("img");
    assert.ok(images.length > 0, "Expected 1 or more img elements");
    console.log(`Found ${images.length} images in the document.`);
  } else {
    console.error("Request failed with status:", xhr.status);
  }
};

// handling network errors like a responsible dev should
xhr.onerror = () => {
  console.error("Network error occurred");
};

xhr.send(); // fin.
```

### [`XMLHttpRequestEventTarget`]

The `XMLHttpRequestEventTarget` class is an abstract base class inherited by
both the `XMLHttpRequest` and `XMLHttpRequestUpload` classes. It provides the
common functionality related to event handling for HTTP requests and uploads.

```ts
import { XMLHttpRequestEventTarget } from "dawm-xhr";

export class CustomXMLHttpRequestThing extends XMLHttpRequestEventTarget {
}
```

### [`XMLHttpRequestUpload`]

```ts
import { XMLHttpRequestUpload } from "dawm-xhr";

// TODO
```

---

## Acknowledgements

This [dawm] submodule was adapted from the `xhr` ponyfill by [Kitson Kelly],
originally designed for Deno-based environments. It has been modified, adapted
for compatibility with [dawm], and remains published under [MIT] license.

---

> [!IMPORTANT]
>
> This module's documentation is incomplete. For an up-to-date reference, refer
> to the source on GitHub or [auto-generated API documentation on JSR][docs].
>
> **Want to contribute and help improve [dawm]'s documentation?** Awesome! See
> the [contributing] guide for details and guidelines on how to get involved.
> Pull Requests are always welcome — please [open an issue] to discuss proposed
> changes before submitting a PR. Thanks for your interest in helping out!

---

<div align="center">

**[MIT] © [Nicholas Berlette] and [Kitson Kelly]. All rights reserved.**

<small>

[dawm] · [github] · [issues] · [contributing] · [docs] · [npm]

</small></div>

[MIT]: https://nick.mit-license.org/2024 "MIT © 2024-2026 Nicholas Berlette"
[Nicholas Berlette]: https://github.com/nberlette "Follow Nicholas Berlette on GitHub"
[Kitson Kelly]: https://github.com/kitsonk "Follow Kitson P. Kelly on GitHub"
[dawm]: https://github.com/nberlette/dawm/#readme "Give the dawm project a star on GitHub!"
[github]: https://github.com/nberlette/dawm/#readme "Give the dawm project a star on GitHub!"
[issues]: https://github.com/nberlette/dawm/issues "Report bugs and file feature requests on the nberlette/dawm GitHub Issue Tracker!"
[open an issue]: https://github.com/nberlette/dawm/issues/new "Report bugs and file feature requests on the nberlette/dawm GitHub Issue Tracker!"
[contributing]: https://github.com/nberlette/dawm/blob/main/.github/CONTRIBUTING.md "Contributing to the dawm project"
[docs]: https://jsr.io/@nick/dawm/doc/~/xml/xpath
[npm]: https://www.npmjs.com/package/dawm "Install dawm from npm"
[`XMLHttpRequest`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
[`XMLHttpRequestEventTarget`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestEventTarget
[`XMLHttpRequestUpload`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestUpload
[`XMLDocument`]: https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument
