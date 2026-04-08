import {
  _,
  ArrayPrototypePush,
  ObjectDefineProperties,
  SymbolToStringTag,
} from "dawm-internal";
import { clone_shallow } from "dawm-internal/keys";

import { NodeListOf } from "./collections/NodeList.ts";

import type { Element } from "./Element.ts";
import type { Node } from "./Node.ts";
import type { strings } from "dawm-internal/types";
import { NodeType } from "./types.ts";
import { ParentNode } from "./ParentNode.ts";

declare module "dawm-internal" {
  export interface DocumentFragmentInternal {
    new: () => DocumentFragment;
  }

  export interface internal {
    DocumentFragment: DocumentFragmentInternal;
  }
}

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
    super();
    _.Node.setNodeName(this, "#document-fragment");
    _.Node.setNodeValue(this, null);
  }

  override get parentNode(): null {
    return null;
  }

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
              ArrayPrototypePush(elements, element);
            }
          }
          if (node.firstChild) traverse(node.firstChild);
          node = node.nextSibling;
        }
      };

      traverse(this.firstChild);
      return elements;
    };

    return new NodeListOf(this, get(), get);
  }

  protected [clone_shallow](): DocumentFragment {
    return _.DocumentFragment.new();
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

  declare readonly [SymbolToStringTag]: "DocumentFragment" | strings;

  static {
    _.toStringTag("DocumentFragment")(this);
  }

  static {
    _.DocumentFragment = {
      new: () => new (DocumentFragment as any)(_.keys._private),
    };
  }
}
