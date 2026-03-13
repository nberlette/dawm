import assert from "node:assert";
import { describe, it } from "node:test";
import { DOMParser } from "../../src/core/DOMParser.ts";
import { CSSUnitValue } from "../../src/css/styles/CSSUnitValue.ts";

describe("core/DOMParser", () => {
  it("parses HTML strings", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<div id="a">hi</div>', "text/html");
    assert.strictEqual(doc.getElementsByTagName("div").length, 1);
  });

  it("parses XML strings", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      "<root><child/></root>",
      "application/xml",
    );
    assert.strictEqual(doc.getElementsByTagName("root").length, 1);
  });

  it("hydrates stylesheet and inline style structures for parsed HTML", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      '<style media="screen">.box{margin-left:0.25rem;padding-top:1px;}</style><div class="box" style="padding-top:2px"></div>',
      "text/html",
    );

    const style = doc.getElementsByTagName("style")[0];
    const div = doc.getElementsByTagName("div")[0];
    assert.ok(style);
    assert.ok(div);

    assert.strictEqual(doc.styleSheets.length, 1);
    const sheet = doc.styleSheets[0];
    assert.ok(sheet);
    assert.strictEqual(sheet.ownerNode, style);
    assert.strictEqual(sheet.cssRules.length, 1);

    const paddingTop = div.attributeStyleMap.get("padding-top");
    assert.ok(paddingTop instanceof CSSUnitValue);
    assert.strictEqual(paddingTop.value, 2);
    assert.strictEqual(paddingTop.unit, "px");

    const computedMarginLeft = div.computedStyleMap.get("margin-left");
    assert.ok(computedMarginLeft instanceof CSSUnitValue);
    assert.strictEqual(computedMarginLeft.value, 0.25);
    assert.strictEqual(computedMarginLeft.unit, "rem");

    const computedPaddingTop = div.computedStyleMap.get("padding-top");
    assert.ok(computedPaddingTop instanceof CSSUnitValue);
    assert.strictEqual(computedPaddingTop.value, 2);
    assert.strictEqual(computedPaddingTop.unit, "px");
  });

  it("hydrates stylesheet and inline style structures for parsed XML", () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      '<root><style>.x{margin-left:0.25rem;}</style><child style="margin-left:0.25rem"/></root>',
      "application/xml",
    );

    assert.strictEqual(doc.styleSheets.length, 1);

    const child = doc.getElementsByTagName("child")[0];
    assert.ok(child);

    const marginLeft = child.attributeStyleMap.get("margin-left");
    assert.ok(marginLeft instanceof CSSUnitValue);
    assert.strictEqual(marginLeft.value, 0.25);
    assert.strictEqual(marginLeft.unit, "rem");
  });
});
