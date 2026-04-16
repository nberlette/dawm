import assert from "node:assert";
import { DOMException } from "../packages/core/src/DOMException.ts";
import { HTMLDocument } from "../packages/html/src/HTMLDocument.ts";
import { XMLDocument } from "../packages/xml/src/XMLDocument.ts";

const originalFetch = globalThis.fetch;

export function createHTMLDocument(): HTMLDocument {
  return new HTMLDocument();
}

export function createXMLDocument(): XMLDocument {
  return new XMLDocument();
}

export function buildSampleDOM() {
  const doc = new HTMLDocument();
  const root = doc.createElement("div");
  root.setAttribute("id", "root");
  doc.appendChild(root);

  const span = doc.createElement("span");
  span.setAttribute("class", "note");
  span.textContent = "hello";
  root.appendChild(span);

  const text = doc.createTextNode("tail");
  root.appendChild(text);

  const child = doc.createElement("p");
  child.setAttribute("data-foo", "bar");
  root.appendChild(child);

  return { doc, root, span, text, child };
}

export function stubFetch(
  response: Response | ((req: Request) => Response | Promise<Response>),
): () => void {
  const original = originalFetch;
  (globalThis as any).fetch = (input: any, init?: any) => {
    const req = input instanceof Request ? input : new Request(input, init);
    if (typeof response === "function") {
      return Promise.resolve(response(req));
    }
    return Promise.resolve(response);
  };
  return () => {
    if (original) {
      (globalThis as any).fetch = original;
    } else {
      delete (globalThis as any).fetch;
    }
  };
}

export function assertThrowsDOM(fn: () => unknown, name: string): void {
  let threw = false;
  try {
    fn();
  } catch (err) {
    threw = true;
    assert.ok(err instanceof DOMException);
    assert.strictEqual(err.name, name);
  }
  assert.ok(threw);
}
