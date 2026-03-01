import {
  _,
  ObjectDefineProperties,
  SymbolToStringTag,
  toStringTag,
  TypeError,
} from "../_internal.ts";
import { clone_shallow } from "../internal/keys.ts";
import { strings } from "../internal/types.ts";
import { Node } from "./Node.ts";
import { readonly } from "./_common.ts";

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
  constructor(nodeName: string, data: string) {
    super(nodeName, data);
  }

  get data(): string {
    return this.nodeValue || "";
  }

  set data(value: string) {
    this.nodeValue = value;
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
    this.data = current.slice(0, offset) + data + current.slice(offset);
  }

  deleteData(offset: number, count: number): void {
    const current = this.data;
    this.data = current.slice(0, offset) + current.slice(offset + count);
  }

  replaceData(offset: number, count: number, data: string): void {
    const current = this.data;
    this.data = current.slice(0, offset) + data + current.slice(offset + count);
  }

  protected [clone_shallow](): CharacterData {
    const Constructor = this.constructor;
    _.webidl.assertBranded(Constructor, CharacterData);
    if (Constructor === CharacterData) {
      throw new TypeError(
        `Cannot directly instantiate the abstract "CharacterData" class.`,
      );
    }
    // @ts-ignores see above for checks  against instantiating abstract class
    return new Constructor(this.nodeName, this.data);
  }

  override cloneNode(): CharacterData {
    return this[clone_shallow]();
  }

  declare readonly [SymbolToStringTag]: "CharacterData" | strings;

  static {
    toStringTag("CharacterData")(this);
  }
}
