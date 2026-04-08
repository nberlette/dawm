import assert from "node:assert";
import { describe, it } from "node:test";
import { HTMLDocument } from "../../../html/src/HTMLDocument.ts";
import { StaticRange } from "../../src/StaticRange.ts";

describe("core/StaticRange", () => {
  it("exposes bounds and collapsed", () => {
    const doc = new HTMLDocument();
    const text = doc.createTextNode("hi");
    const range = new StaticRange(text, 0, text, 0);
    assert.ok(range.collapsed);
  });
});
