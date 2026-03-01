import { clone_shallow } from "../internal/keys.ts";
import {
  ObjectDefineProperties,
  SymbolToStringTag,
} from "../internal/primordials.ts";
import { NodeType } from "../wasm/index.js";
import { CharacterData } from "./CharacterData.ts";
import { readonly } from "./_common.ts";

/**
 * Represents a ProcessingInstruction node as defined by the DOM Standard.
 * @category DOM
 * @tags ProcessingInstruction
 */
export class ProcessingInstruction extends CharacterData {
  #target = "";

  constructor(target: string, data: string) {
    super("#processing-instruction", data);
    this.#target = target;
  }

  get nodeType(): NodeType.ProcessingInstruction {
    return NodeType.ProcessingInstruction;
  }

  get target(): string {
    return this.#target;
  }

  protected override [clone_shallow](): ProcessingInstruction {
    return new ProcessingInstruction(this.target, this.data);
  }

  override cloneNode(): ProcessingInstruction {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "ProcessingInstruction";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly(
        "ProcessingInstruction",
        false,
        true,
      ),
    });
  }
}
