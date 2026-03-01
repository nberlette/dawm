import { _, ObjectDefineProperties, SymbolToStringTag } from "../_internal.ts";
import { readonly } from "./_common.ts";

import { NodeType } from "./types.ts";
import { CharacterData } from "./CharacterData.ts";
import { Node } from "./Node.ts";
import { clone_shallow } from "../internal/keys.ts";

/**
 * Represents a Text node as defined by the DOM Standard.
 *
 * This is a subclass of the {@linkcode CharacterData} interface, with several
 * text-specific properties and methods added on top of the inherited API.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode CharacterData} for character data-specific properties and
 * methods[]
 * @category Types
 * @tags DOM, Text
 */
export class Text extends CharacterData {
  constructor(data: string) {
    super("#text", data);
  }

  get nodeType(): NodeType.Text {
    return NodeType.Text;
  }

  get wholeText(): string {
    // deno-lint-ignore no-this-alias
    let start: Node | null = this;
    while (
      start?.previousSibling && start.previousSibling.nodeType === NodeType.Text
    ) {
      start = start.previousSibling;
    }
    let text = "";
    let cursor: Node | null = start;
    while (cursor && cursor.nodeType === NodeType.Text) {
      text += cursor.nodeValue ?? "";
      cursor = cursor.nextSibling;
    }
    return text;
  }

  splitText(offset: number): Text {
    const current = this.data;
    const head = current.slice(0, offset);
    const tail = current.slice(offset);
    this.data = head;
    const newText = new Text(tail);
    if (this.parentNode) {
      this.parentNode.insertBefore(newText, this.nextSibling);
    }
    return newText;
  }

  protected override [clone_shallow](): Text {
    return new Text(this.data);
  }

  override cloneNode(): Text {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "Text";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("Text", false, true),
    });
  }
}
