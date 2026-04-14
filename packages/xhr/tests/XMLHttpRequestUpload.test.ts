import assert from "node:assert";
import { describe, it } from "node:test";
import { XMLHttpRequestUpload } from "../src/XMLHttpRequestUpload.ts";
import { kUploadBrand } from "../src/_helpers.ts";

describe("xml/XMLHttpRequestUpload", () => {
  it("exposes upload brand", () => {
    const upload = new XMLHttpRequestUpload();
    assert.strictEqual((upload as any)[kUploadBrand], kUploadBrand);
  });
});
