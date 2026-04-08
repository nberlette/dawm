import assert from "node:assert";
import { describe, it } from "node:test";
import { DocumentType } from "../../src/DocumentType.ts";
import { NodeType } from "../../src/types.ts";

describe("core/DocumentType", () => {
  it("exposes name/publicId/systemId", () => {
    const dt = new DocumentType("html", "pid", "sid");
    assert.strictEqual(dt.nodeType, NodeType.DocumentType);
    assert.strictEqual(dt.name, "html");
    assert.strictEqual(dt.publicId, "pid");
    assert.strictEqual(dt.systemId, "sid");
  });
});
