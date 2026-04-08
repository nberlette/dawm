import { _, SymbolToStringTag } from "dawm-internal";
import { NodeType } from "./types.ts";
import { Node } from "./Node.ts";
import { clone_shallow } from "dawm-internal/keys";

declare module "dawm-internal" {
  export interface DocumentTypeInternal {
    new: (
      name: string,
      publicId?: string | null,
      systemId?: string | null,
      internalSubset?: string | null,
    ) => DocumentType;
    getPublicId(instance: DocumentType): string;
    setPublicId(instance: DocumentType, publicId: string): DocumentType;
    getSystemId(instance: DocumentType): string;
    setSystemId(instance: DocumentType, systemId: string): DocumentType;
    getInternalSubset(instance: DocumentType): string | null;
    setInternalSubset(
      instance: DocumentType,
      internalSubset: string | null,
    ): DocumentType;
  }

  export interface internal {
    DocumentType: DocumentTypeInternal;
  }
}

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
  #publicId = "";
  #systemId = "";
  #internalSubset: string | null = null;

  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
  }

  get nodeType(): NodeType.DocumentType {
    return NodeType.DocumentType;
  }

  get name(): string {
    return this.nodeName;
  }

  get publicId(): string {
    return _.DocumentType.getPublicId(this);
  }

  get systemId(): string {
    return _.DocumentType.getSystemId(this);
  }

  get internalSubset(): string | null {
    return _.DocumentType.getInternalSubset(this);
  }

  protected [clone_shallow](): DocumentType {
    return _.DocumentType.new(
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
    _.DocumentType = {
      new: (name, publicId = "", systemId = "", internalSubset = null) => {
        const documentType = new (DocumentType as any)(_.keys._private);
        _.Node.setNodeName(documentType, name);
        _.Node.setNodeValue(documentType, null);
        _.DocumentType.setPublicId(documentType, publicId ?? "");
        _.DocumentType.setSystemId(documentType, systemId ?? "");
        _.DocumentType.setInternalSubset(documentType, internalSubset);
        return documentType;
      },
      getPublicId: (instance) => instance.#publicId,
      setPublicId: (instance, publicId) => (
        (instance.#publicId = publicId), instance
      ),
      getSystemId: (instance) => instance.#systemId,
      setSystemId: (instance, systemId) => (
        (instance.#systemId = systemId), instance
      ),
      getInternalSubset: (instance) => instance.#internalSubset,
      setInternalSubset: (instance, internalSubset) => (
        (instance.#internalSubset = internalSubset), instance
      ),
    };
    _.toStringTag((p) => p.name)(this);
  }
}
