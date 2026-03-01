import { _, ObjectDefineProperties, SymbolToStringTag } from "../_internal.ts";
import { readonly } from "./_common.ts";

import { NodeList, NodeListOf } from "../collections/index.ts";
import { NodeType } from "./types.ts";
import { Document } from "./Document.ts";
import { Element } from "./Element.ts";
import { Node } from "./Node.ts";
import { clone_shallow } from "../internal/keys.ts";

/**
 * Represents a DOM Attr as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds a
 * subset of the attribute-specific properties and methods found in the DOM
 * specification, which focus on implementing the behavior of attribute nodes
 * and their relationships to element nodes.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode Element} for the element-specific properties and methods.
 * @category Types
 * @tags DOM, Attribute
 */
export class Attr extends Node {
  constructor(
    name: string,
    value: string,
    namespaceURI?: string | null,
    ownerElement?: Element | null,
  ) {
    super(name, value);
    this.namespaceURI = namespaceURI ?? null;
    this.ownerElement = ownerElement ?? null;
    this.ownerDocument = ownerElement?.ownerDocument ?? null;
  }

  ownerElement: Element | null = null;

  override ownerDocument: Document | null = null;

  override readonly firstChild: null = null;
  override readonly lastChild: null = null;
  override readonly previousSibling: null = null;
  override readonly nextSibling: null = null;
  override readonly parentNode: null = null;
  override readonly childNodes: NodeListOf<Node> = new NodeList(this, []);

  get nodeType(): NodeType.Attribute {
    return NodeType.Attribute;
  }

  get specified(): boolean {
    return true;
  }

  get name(): string {
    return this.nodeName;
  }

  get value(): string {
    return this.nodeValue ?? "";
  }

  set value(v: string) {
    this.nodeValue = v;
  }

  protected [clone_shallow](): Attr {
    const clone = new Attr(this.nodeName, this.value, this.namespaceURI);
    return clone;
  }

  override cloneNode(): Attr {
    const clone = this[clone_shallow]();
    clone.ownerElement = this.ownerElement;
    return clone;
  }

  override appendChild(newChild: Node): never {
    void newChild;
    throw new DOMException(
      "Failed to execute 'appendChild' on 'Attr': Attr nodes cannot have children.",
      "HierarchyRequestError",
    );
  }

  override insertBefore(newChild: Node, refChild: Node | null): never {
    void newChild, void refChild;
    throw new DOMException(
      "Failed to execute 'insertBefore' on 'Attr': Attr nodes cannot have children.",
      "HierarchyRequestError",
    );
  }

  override removeChild(oldChild: Node): never {
    void oldChild;
    throw new DOMException(
      "Failed to execute 'removeChild' on 'Attr': Attr nodes cannot have children.",
      "HierarchyRequestError",
    );
  }

  override replaceChild(newChild: Node, oldChild: Node): never {
    void newChild, void oldChild;
    throw new DOMException(
      "Failed to execute 'replaceChild' on 'Attr': Attr nodes cannot have children.",
      "HierarchyRequestError",
    );
  }

  declare readonly [SymbolToStringTag]: "Attr";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("Attr", false, true),
    });
  }
}
