import { _, ObjectDefineProperties, SymbolToStringTag } from "dawm-internal";
import { NodeType } from "./types.ts";
import { CharacterData } from "./CharacterData.ts";
import { readonly } from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";

/**
 * Represents a Comment node as defined by the DOM Standard.
 * @category Types
 * @tags DOM, Comment
 */
export class Comment extends CharacterData {
  constructor(data = "") {
    super();
    _.CharacterData.initialize(this, "#comment", data);
  }

  get nodeType(): NodeType.Comment {
    return NodeType.Comment;
  }

  protected override [clone_shallow](): Comment {
    return new Comment(this.data);
  }

  override cloneNode(): Comment {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "Comment";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("Comment", false, true),
    });
  }
}
