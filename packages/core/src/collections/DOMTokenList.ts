import { isFunction } from "dawm-internal";
import { indexOf } from "dawm-internal/collection-helpers";
import type { Element } from "dawm-core/element";
import {
  FunctionPrototypeCall,
  ObjectDefineProperty,
  StringPrototypeSplit,
  StringPrototypeTrim,
} from "dawm-internal/primordials";

// #endregion HTMLCollection
// #region DOMTokenList
/**
 * Represents a set of space-separated tokens, such as those found in the
 * class attribute of an HTML element.
 *
 * @category Collections
 * @tags DOMTokenList
 */

export class DOMTokenList {
  #ownerElement: Element;
  #attributeName: string;
  #tokens: string[] | null = null;
  #updating: boolean = false;

  constructor(ownerElement: Element, attributeName: string) {
    this.#ownerElement = ownerElement;
    this.#attributeName = attributeName;
    this.#updateTokens();
  }

  #updateTokens = (value?: string) => {
    if (!this.#updating) {
      this.#updating = true;
      value ??= this.#ownerElement.getAttribute(this.#attributeName) ?? "";
      this.#tokens = StringPrototypeSplit(StringPrototypeTrim(value), /\s+/)
        .filter((t, i, a) => t.length > 0 && indexOf(a, t) === i);
      this.#updating = false;
    }
    return this.#tokens ??= [];
  };

  #updateAttribute = (value?: string) => {
    if (!this.#updating) {
      this.#updating = true;
      this.#ownerElement.setAttribute(
        this.#attributeName,
        value ??= this.value,
      );
      this.#updating = false;
    }
    return value;
  };

  get value(): string {
    return this.#tokens?.join(" ") ?? "";
  }

  set value(v: string) {
    this.#updateTokens(v);
    this.#updateAttribute();
  }

  get length(): number {
    return this.#tokens?.length ?? 0;
  }

  item(index: number): string | null {
    return this.#updateTokens()?.[index] ?? null;
  }

  contains(token: string): boolean {
    return this.#updateTokens()?.includes(token) ?? false;
  }

  add(...tokens: string[]): void {
    const list = this.#updateTokens();
    list.push(...tokens);
    this.#tokens = list.filter((t, i, a) => indexOf(a, t) === i);
    this.#updateAttribute();
  }

  remove(...tokens: string[]): void {
    this.#tokens = this.#updateTokens().filter((t) =>
      indexOf(tokens, t) === -1
    );
    this.#updateAttribute();
  }

  toggle(token: string, force?: boolean): boolean {
    const contains = this.#updateTokens()?.includes(token) ?? false;
    if (force == null) force = !contains;
    if (force) {
      this.add(token);
    } else {
      this.remove(token);
    }
    return !contains;
  }

  replace(oldToken: string, newToken: string): boolean {
    const tokens = this.#updateTokens();
    const index = indexOf(tokens, oldToken);
    if (index === -1) return false;
    tokens[index] = newToken;
    this.#tokens = tokens.filter((t, i, a) => indexOf(a, t) === i);
    this.#updateAttribute(this.#tokens.join(" "));
    return true;
  }

  supports(token: string): boolean {
    return void token, true; // always true per spec
  }

  forEach<This = void>(
    callback: (
      this: This,
      token: string,
      index: number,
      list: DOMTokenList,
    ) => void,
    thisArg?: This,
  ): void {
    if (!isFunction(callback)) {
      throw new TypeError("callback is not a function");
    }
    const tokens = this.#updateTokens();
    for (let i = 0; i < tokens.length; i++) {
      FunctionPrototypeCall(callback, thisArg, tokens[i], i, this);
    }
  }

  *[Symbol.iterator](): IterableIterator<string> {
    for (const token of this.#updateTokens()) yield token;
  }

  declare readonly [Symbol.toStringTag]: "DOMTokenList";

  static {
    ObjectDefineProperty(this.prototype, Symbol.toStringTag, {
      value: "DOMTokenList",
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}
