import { _, type SymbolToStringTag, toStringTag } from "../_internal.ts";
import { clone_shallow } from "../internal/keys.ts";
import { NodeType } from "./types.ts";
import { CharacterData } from "./CharacterData.ts";

/**
 * Represents a CDATASection node as defined by the DOM Standard.
 * q
 * @category DOM
 * @tags Core, CDATASection
 */
export class CDATASection extends CharacterData {
  constructor(data: string) {
    super("#cdata-section", data);
  }

  get nodeType(): NodeType.CDATASection {
    return NodeType.CDATASection;
  }

  protected override [clone_shallow](): CDATASection {
    return new CDATASection(this.data);
  }

  override cloneNode(): CDATASection {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "CDATASection";

  static {
    toStringTag("CDATASection")(this);
  }
}
