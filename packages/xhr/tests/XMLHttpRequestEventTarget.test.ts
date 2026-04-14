import assert from "node:assert";
import { describe, it } from "node:test";
import { ProgressEvent } from "../../core/src/events/ProgressEvent.ts";
import { XMLHttpRequestEventTarget } from "../src/XMLHttpRequestEventTarget.ts";

describe("xml/XMLHttpRequestEventTarget", () => {
  it("invokes event handler properties", () => {
    const target = new (class extends XMLHttpRequestEventTarget {})();
    let called = false;
    target.onload = () => {
      called = true;
    };
    target.dispatchEvent(new ProgressEvent("load"));
    assert.ok(called);
  });
});
