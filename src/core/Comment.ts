import { ObjectDefineProperties, SymbolToStringTag } from "../_internal.ts";
import { NodeType } from "./types.ts";
import { CharacterData } from "./CharacterData.ts";
import { readonly } from "./_common.ts";
import { clone_shallow } from "../internal/keys.ts";

/**
 * Represents a Comment node as defined by the DOM Standard.
 * @category Types
 * @tags DOM, Comment
 */
export class Comment extends CharacterData {
  constructor(data: string) {
    super("#comment", data);
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
