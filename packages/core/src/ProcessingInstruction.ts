import { _, readonly } from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";
import {
  ObjectDefineProperties,
  SymbolToStringTag,
} from "dawm-internal/primordials";
import { NodeType } from "dawm-core/types";
import { CharacterData } from "./CharacterData.ts";

declare module "dawm-internal" {
  export interface ProcessingInstructionInternal {
    new: (
      target: string,
      data?: string | null,
    ) => ProcessingInstruction;
    getTarget(instance: ProcessingInstruction): string;
    setTarget(
      instance: ProcessingInstruction,
      target: string,
    ): ProcessingInstruction;
  }

  export interface internal {
    ProcessingInstruction: ProcessingInstructionInternal;
  }
}

/**
 * Represents a ProcessingInstruction node as defined by the DOM Standard.
 * @category DOM
 * @tags ProcessingInstruction
 */
export class ProcessingInstruction extends CharacterData {
  #target = "";

  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
    _.CharacterData.initialize(this, "#processing-instruction");
  }

  get nodeType(): NodeType.ProcessingInstruction {
    return NodeType.ProcessingInstruction;
  }

  get target(): string {
    return _.ProcessingInstruction.getTarget(this);
  }

  protected override [clone_shallow](): ProcessingInstruction {
    return _.ProcessingInstruction.new(this.target, this.data);
  }

  override cloneNode(): ProcessingInstruction {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "ProcessingInstruction";

  static {
    _.ProcessingInstruction = {
      new: (target, data = "") => {
        const instruction = new (ProcessingInstruction as any)(_.keys._private);
        _.CharacterData.initialize(
          instruction,
          "#processing-instruction",
          data,
        );
        _.ProcessingInstruction.setTarget(instruction, target);
        return instruction;
      },
      getTarget: (instance) => instance.#target,
      setTarget: (instance, target) => ((instance.#target = target), instance),
    };
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly(
        "ProcessingInstruction",
        false,
        true,
      ),
    });
  }
}
