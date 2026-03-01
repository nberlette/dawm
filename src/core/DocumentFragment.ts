import { NodeListOf } from "../collections/index.ts";
import {
  ObjectDefineProperties,
  SymbolToStringTag,
} from "../internal/primordials.ts";
import { NodeType } from "../wasm/index.js";
import { Element } from "./Element.ts";
import { Node } from "./Node.ts";
import { readonly } from "./_common.ts";
import { ParentNode } from "./ParentNode.ts";
import { clone_shallow } from "../internal/keys.ts";

/**
 * Represents a DOM DocumentFragment as defined by the DOM Standard.
 *
 * This is a subclass of the abstract {@linkcode Node} interface. It adds
 * document fragment-specific properties and methods found in the DOM specification.
 *
 * @see {@linkcode Node} for the base Node properties and methods.
 * @category Types
 * @tags DOM, DocumentFragment
 */

export class DocumentFragment extends ParentNode {
  constructor() {
    super("#document-fragment", null);
  }

  override readonly parentNode: null = null;

  get nodeType(): NodeType.DocumentFragment {
    return NodeType.DocumentFragment;
  }

  getElementsByName<T extends Element>(name: string): NodeListOf<T> {
    const get = () => {
      const elements: T[] = [];

      const traverse = (node: Node | null): void => {
        while (node) {
          if (node.nodeType === NodeType.Element) {
            const element = node as T;
            if (element.getAttribute("name") === name) {
              elements.push(element);
            }
          }
          if (node.nextSibling) node = node.nextSibling;
          else node = node.firstChild;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  protected [clone_shallow](): DocumentFragment {
    return new DocumentFragment();
  }

  override cloneNode(deep?: boolean): DocumentFragment {
    const clone = this[clone_shallow]();
    if (deep) {
      for (
        let child = this.firstElementChild;
        child;
        child = child.nextElementSibling
      ) {
        const childClone = child.cloneNode(true);
        clone.appendChild(childClone);
      }
    }
    return clone;
  }

  declare readonly [SymbolToStringTag]: "DocumentFragment";

  static {
    ObjectDefineProperties(this.prototype, {
      [SymbolToStringTag]: readonly("DocumentFragment", false, true),
    });
  }
}
