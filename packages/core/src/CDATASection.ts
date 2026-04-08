import { _, type SymbolToStringTag, toStringTag } from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";
import { NodeType } from "./types.ts";
import { CharacterData } from "./CharacterData.ts";

declare module "dawm-internal" {
  export interface CDATASectionInternal {
    new: (data?: string | null) => CDATASection;
  }

  export interface internal {
    CDATASection: CDATASectionInternal;
  }
}

/**
 * Represents a CDATASection node as defined by the DOM Standard.
 * q
 * @category DOM
 * @tags Core, CDATASection
 */
export class CDATASection extends CharacterData {
  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
    _.CharacterData.initialize(this, "#cdata-section");
  }

  get nodeType(): NodeType.CDATASection {
    return NodeType.CDATASection;
  }

  protected override [clone_shallow](): CDATASection {
    return _.CDATASection.new(this.data);
  }

  override cloneNode(): CDATASection {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "CDATASection";

  static {
    _.CDATASection = {
      new: (data = "") => {
        const section = new (CDATASection as any)(_.keys._private);
        _.CharacterData.initialize(section, "#cdata-section", data);
        return section;
      },
    };
    toStringTag("CDATASection")(this);
  }
}
