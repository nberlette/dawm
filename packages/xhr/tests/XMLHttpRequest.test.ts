import assert from "node:assert";
import { describe, it } from "node:test";
import { XMLHttpRequest } from "../src/XMLHttpRequest.ts";
import { assertThrowsDOM, stubFetch } from "../../../test-support/_utils.ts";

describe("xml/XMLHttpRequest", () => {
  it("validates open arguments", () => {
    const xhr = new XMLHttpRequest();
    assertThrowsDOM(
      () => xhr.open("TRACE", "https://example.com"),
      "SecurityError",
    );
    assertThrowsDOM(() => xhr.open("GET", ":://bad"), "SyntaxError");
    assertThrowsDOM(
      () => xhr.open("GET", "https://example.com", false),
      "InvalidAccessError",
    );
  });

  it("sends requests using fetch", async () => {
    const restore = stubFetch(
      new Response("ok", { headers: { "content-type": "text/plain" } }),
    );
    const xhr = new XMLHttpRequest();
    const done = new Promise<void>((resolve) => {
      xhr.addEventListener("loadend", () => resolve());
    });
    xhr.open("GET", "https://example.com/");
    xhr.send();
    await done;
    assert.strictEqual(xhr.responseText, "ok");
    restore();
  });
});
