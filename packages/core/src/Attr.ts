import {
  _,
  SymbolToStringTag,
  WeakRef,
  WeakRefPrototypeDeref,
} from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";

import type { Document } from "./Document.ts";
import type { Element } from "./Element.ts";
import { NodeType } from "./types.ts";
import { Node } from "./Node.ts";
import { DOMException } from "./DOMException.ts";
import { NamedNodeMap } from "dawm-core/collections/named-node-map";

declare module "dawm-internal" {
  export interface AttrInternal extends NodeInternal {
    new: (
      name: string,
      value: string,
      namespaceURI?: string | null,
      ownerElement?: Element | null,
      ownerDocument?: Document | null,
    ) => Attr;
    getOwnerElement(attr: Attr): Element | null;
    setOwnerElement(attr: Attr, element: Element | null): Attr;
    getNamedNodeMapRef(attr: Attr): WeakRef<NamedNodeMap> | null;
    setNamedNodeMapRef(attr: Attr, map: WeakRef<NamedNodeMap> | null): Attr;
    getNamedNodeMap(attr: Attr): NamedNodeMap | null;
    setNamedNodeMap(attr: Attr, map: NamedNodeMap | null): Attr;
    getSpecified(attr: Attr): boolean;
    setSpecified(attr: Attr, specified: boolean): Attr;
    setName(attr: Attr, name: string): Attr;
    setValue(attr: Attr, value: string): Attr;
  }

  export interface internal {
    Attr: AttrInternal;
  }
}

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
  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
  }

  #ownerElement: Element | null = null;
  #namedNodeMap: WeakRef<NamedNodeMap> | null = null;
  #specified = true;

  get nodeType(): NodeType.Attribute {
    return NodeType.Attribute;
  }

  get ownerElement(): Element | null {
    return this.#ownerElement;
  }

  override get ownerDocument(): Document | null {
    return this.#ownerElement?.ownerDocument ?? _.Node.getOwnerDocument(this);
  }

  override get firstChild(): null {
    return null; // Attr nodes cannot have children
  }

  override get lastChild(): null {
    return null; // Attr nodes cannot have children
  }

  override get previousSibling(): null {
    return null; // Attr nodes cannot have siblings
  }

  override get nextSibling(): null {
    return null; // Attr nodes cannot have siblings
  }

  override get parentNode(): null {
    // Attr nodes do not have a parent node, and are not part of the normal DOM
    // tree structure; instead, they have an associated ownerElement which is
    // the element they are attached to. per spec, parentNode must return null.
    return null;
  }

  override get nodeName(): string {
    // we override this accessor to ensure it is readonly (no setter)
    return super.nodeName;
  }

  override get nodeValue(): string {
    // we override this accessor to ensure it is readonly (no setter)
    return super.nodeValue || "";
  }

  get specified(): boolean {
    // legacy property; per spec this should always return true, but we still
    // allow it to be set internally for compatibility (not settable by user
    // code, however)
    return _.Attr.getSpecified(this);
  }

  get name(): string {
    return this.nodeName;
  }

  get value(): string {
    return this.nodeValue || "";
  }

  set value(v: string) {
    _.Attr.setNodeValue(this, (v || "") + "");
  }

  protected [clone_shallow](): Attr {
    const clone = _.Attr.new(
      this.nodeName,
      this.nodeValue,
      this.namespaceURI,
      this.ownerElement,
      _.Node.getOwnerDocument(this),
    );
    return clone;
  }

  override cloneNode(): Attr {
    const clone = this[clone_shallow]();
    clone.#ownerElement = this.#ownerElement;
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
    _.toStringTag("Attr")(this);

    _.Attr = {
      ..._.Node,
      new: (name, value, namespaceURI, ownerElement, ownerDocument) => {
        const attr = new (Attr as any)(_.keys._private);
        _.Attr.setNodeName(attr, name);
        _.Attr.setNodeValue(attr, value);
        _.Attr.setNamespaceURI(attr, namespaceURI ?? null);
        _.Attr.setOwnerDocument(
          attr,
          ownerDocument ?? ownerElement?.ownerDocument ?? null,
        );
        if (ownerElement) {
          _.Attr.setOwnerElement(attr, ownerElement);
          _.Attr.setNamedNodeMapRef(attr, new WeakRef(ownerElement.attributes));
        }
        return attr;
      },
      getOwnerElement: (a) => a.#ownerElement,
      setOwnerElement: (a, e) => (a.#ownerElement = e, a),
      getSpecified: (a) => a.#specified,
      setSpecified: (a, s) => (a.#specified = !!s, a),
      setName: (a, name) => _.Attr.setNodeName(a, name),
      setValue: (a, value) => _.Attr.setNodeValue(a, value),
      getNamedNodeMapRef: (a) => a.#namedNodeMap,
      setNamedNodeMapRef: (a, map) => (a.#namedNodeMap = map, a),
      getNamedNodeMap: (a) =>
        a.#namedNodeMap ? WeakRefPrototypeDeref(a.#namedNodeMap) ?? null : null,
      setNamedNodeMap: (
        a,
        map,
      ) => (_.Attr.setNamedNodeMapRef(a, map ? new WeakRef(map) : null)),
    };
  }
}
