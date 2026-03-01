import { _, ObjectDefineProperties, SymbolToStringTag } from "../_internal.ts";
import { NodeType } from "./types.ts";
import { Node } from "./Node.ts";
import { readonly } from "./_common.ts";
import { clone_shallow } from "../internal/keys.ts";

/**
 * Represents a DOM DocumentType as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document type-specific properties found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, DocumentType
 */
export class DocumentType extends Node {
  readonly publicId: string;
  readonly systemId: string;
  readonly internalSubset: string | null = null;

  constructor(
    name: string,
    publicId: string,
    systemId: string,
    internalSubset: string | null = null,
  ) {
    super(name, null);
    this.publicId = publicId;
    this.systemId = systemId;
    this.internalSubset = internalSubset;
  }

  get nodeType(): NodeType.DocumentType {
    return NodeType.DocumentType;
  }

  get name(): string {
    return this.nodeName;
  }

  protected [clone_shallow](): DocumentType {
    return new DocumentType(
      this.name,
      this.publicId,
      this.systemId,
      this.internalSubset,
    );
  }

  override cloneNode(): DocumentType {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "DocumentType";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("DocumentType", false, true),
    });
  }
}
