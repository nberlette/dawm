import {
  _,
  StringPrototypeSlice,
  SymbolToStringTag,
  toStringTag,
  TypeError,
} from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";
import { Node } from "./Node.ts";

declare module "dawm-internal" {
  export interface CharacterDataInternal {
    initialize<T extends CharacterData>(
      instance: T,
      nodeName: string,
      data?: string | null,
    ): T;
  }

  export interface internal {
    CharacterData: CharacterDataInternal;
  }
}

/**
 * Represents a CharacterData node as defined by the DOM Standard.
 *
 * This is an abstract subclass of the {@linkcode Node} interface, serving as a
 * common ancestor for concrete character data nodes like {@linkcode Text},
 * {@linkcode Comment}, and {@linkcode CDATASection} (among others).
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @see {@linkcode Text} for text node-specific properties and methods.
 * @category Types
 * @tags DOM, CharacterData
 */
export abstract class CharacterData extends Node {
  constructor() {
    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: CharacterData,
      abstract: true,
    });
    super();
  }

  get data(): string {
    return _.Node.getNodeValue(this) ?? "";
  }

  set data(value: string) {
    _.Node.setNodeValue(this, value);
  }

  get length(): number {
    return this.data.length;
  }

  substringData(offset: number, count: number): string {
    return this.data.substring(offset, offset + count);
  }

  appendData(data: string): void {
    this.data += data;
  }

  insertData(offset: number, data: string): void {
    const current = this.data;
    this.data = StringPrototypeSlice(current, 0, offset) + data +
      StringPrototypeSlice(current, offset);
  }

  deleteData(offset: number, count: number): void {
    const current = this.data;
    this.data = StringPrototypeSlice(current, 0, offset) +
      StringPrototypeSlice(current, offset + count);
  }

  replaceData(offset: number, count: number, data: string): void {
    const current = this.data;
    this.data = StringPrototypeSlice(current, 0, offset) + data +
      StringPrototypeSlice(current, offset + count);
  }

  override appendChild<TNode extends Node>(newChild: TNode): TNode {
    void newChild;
    throw new TypeError(
      `Cannot append child nodes to a CharacterData node.`,
    );
  }

  override insertBefore<TNode extends Node>(
    newChild: TNode,
    refChild: Node | null,
  ): TNode {
    void newChild, void refChild;
    throw new TypeError(
      `Cannot insert child nodes into a CharacterData node.`,
    );
  }

  override replaceChild<TChild extends Node, TNode extends Node>(
    newChild: TChild,
    oldChild: TNode,
  ): TNode {
    void newChild, void oldChild;
    throw new TypeError(
      `Cannot replace child nodes of a CharacterData node.`,
    );
  }

  override removeChild<TNode extends Node>(oldChild: TNode): TNode {
    void oldChild;
    throw new TypeError(
      `Cannot remove child nodes from a CharacterData node.`,
    );
  }

  override normalize(): void {
    // CharacterData nodes cannot have children, so normalization is a no-op.
  }

  override isEqualNode(otherNode: Node | null): boolean {
    if (!super.isEqualNode(otherNode)) return false;
    if (!(otherNode instanceof CharacterData)) return false;
    return this.data === otherNode.data;
  }

  override isSameNode(otherNode: Node | null): boolean {
    return super.isSameNode(otherNode);
  }

  protected [clone_shallow](): CharacterData {
    throw new TypeError(
      `Cannot clone abstract CharacterData directly; subclasses must override ${
        String(clone_shallow)
      }.`,
    );
  }

  override cloneNode(): CharacterData {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    _.CharacterData = {
      initialize: (instance, nodeName, data = "") => {
        _.Node.setNodeName(instance, nodeName);
        _.Node.setNodeValue(instance, data);
        return instance;
      },
    };
    toStringTag("CharacterData")(this);
  }
}
