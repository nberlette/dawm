import { _, ArrayPrototypePush, StringPrototypeMatch } from "dawm-internal";
import { ParentNode } from "./ParentNode.ts";
import { Element } from "./Element.ts";
import {
  createHTMLCollection,
  type HTMLCollectionOf,
} from "./collections/HTMLCollection.ts";
import { NodeListOf } from "./collections/NodeList.ts";

declare module "dawm-internal" {
  export interface DocumentOrShadowRootInternal {
    /**
     * Gets the internal {@linkcode DocumentOrShadowRoot.activeElement} slot
     * for the given target, or `null` if there is no active element.
     *
     * This method is used internally to implement the `activeElement` property,
     * which represents the focused element within the document or shadow root.
     */
    getActiveElement<
      T extends DocumentOrShadowRoot,
    >(target: T): Element | null;
    /**
     * Sets the internal {@linkcode DocumentOrShadowRoot.activeElement} slot
     * for the given target to the provided element, and returns the target.
     * If the value is `null` or `undefined`, the slot is reset to `null`.
     *
     * This is used internally to implement the `activeElement` property, which
     * represents the focused element within the document or shadow root.
     */
    setActiveElement<
      T extends DocumentOrShadowRoot,
    >(target: T, element: Element | null | undefined): T;

    /**
     * Get the internal {@linkcode DocumentOrShadowRoot.fullscreenElement} slot
     * value for the given target, if present, or `null` otherwise.
     *
     * This is used internally to implement the `fullscreenElement` property,
     * which represents the element that is currently being presented in full-
     * screen viewing mode.
     */
    getFullscreenElement<
      T extends DocumentOrShadowRoot,
    >(target: T): Element | null;
    /**
     * Set the internal {@linkcode DocumentOrShadowRoot.fullscreenElement} slot
     * value for the given target to the provided element, and returns the
     * target. If the value is `null` or `undefined`, the slot is reset to
     * `null`.
     *
     * This is used internally to implement the `fullscreenElement` property,
     * which represents the element that is currently being presented in
     * full-screen viewing mode.
     */
    setFullscreenElement<
      T extends DocumentOrShadowRoot,
    >(target: T, element: Element | null): T;

    /**
     * Get the internal {@linkcode DocumentOrShadowRoot.pointerLockElement}
     * slot value for the given target, if present, or `null` otherwise.
     *
     * This is used internally to implement the `pointerLockElement` property,
     * which represents the element that is currently locked to the pointer.
     */
    getPointerLockElement<
      T extends DocumentOrShadowRoot,
    >(target: T): Element | null;
    /**
     * Set the internal {@linkcode DocumentOrShadowRoot.pointerLockElement}
     * slot value for the given target to the provided element, and returns the
     * target. If the value is `null` or `undefined`, the slot is reset to
     * `null`.
     *
     * This is used internally to implement the `pointerLockElement` property,
     * which represents the element that is currently locked to the pointer.
     */
    setPointerLockElement<
      T extends DocumentOrShadowRoot,
    >(target: T, element: Element | null): T;
  }

  export interface internal {
    DocumentOrShadowRoot: DocumentOrShadowRootInternal;
  }
}

export interface DocumentOrShadowRoot extends ParentNode {}

export abstract class DocumentOrShadowRoot {
  #activeElement: Element | null = null;
  #fullscreenElement: Element | null = null;
  #pointerLockElement: Element | null = null;

  constructor() {
    _.enforcePrivateConstructor({ arguments });
  }

  get activeElement(): Element | null {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    return this.#activeElement || null;
  }

  get fullscreenElement(): Element | null {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    return this.#fullscreenElement || null;
  }

  get pointerLockElement(): Element | null {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    return this.#pointerLockElement || null;
  }

  get children(): HTMLCollectionOf<Element> {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    return createHTMLCollection(
      this,
      () => {
        const elements: Element[] = [];
        for (const node of this.childNodes) {
          if (_.isElement(node)) ArrayPrototypePush(elements, node);
        }
        return elements;
      },
      "children",
    );
  }

  get firstElementChild(): Element | null {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    for (let node = this.firstChild; node; node = node?.nextSibling!) {
      if (_.isElement(node)) return node;
    }
    return null;
  }

  get lastElementChild(): Element | null {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    for (let node = this.lastChild; node; node = node?.previousSibling!) {
      if (_.isElement(node)) return node;
    }
    return null;
  }

  get childElementCount(): number {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    let count = 0;
    for (let node = this.firstChild; node; node = node?.nextSibling!) {
      if (_.isElement(node)) count++;
    }
    return count;
  }

  getElementsByName<T extends Element>(elementName: string): NodeListOf<T> {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    const name = _.webidl.converters.DOMString(
      elementName,
      {
        prefix:
          "Failed to execute 'getElementsByName' on 'DocumentOrShadowRoot'",
        context: "elementName is not a valid DOMString",
      },
    );
    const get = () => {
      const list: T[] = [];
      for (
        let node = this.firstElementChild;
        node;
        node = node.nextElementSibling
      ) {
        if (node.getAttribute("name") === name) {
          ArrayPrototypePush(list, node as T);
        }
      }
      return list;
    };
    return _.NodeList.new(this, get(), get);
  }

  getElementsByTagName<T extends Element>(
    qualifiedName: string,
  ): HTMLCollectionOf<T> {
    _.webidl.assertBranded(this, DocumentOrShadowRootPrototype);
    const qName = _.webidl.converters.DOMString(qualifiedName, {
      prefix:
        "Failed to execute 'getElementsByTagName' on 'DocumentOrShadowRoot'",
      context: "qualifiedName is not a valid DOMString",
    });
    const [, prefix, localName] =
      StringPrototypeMatch(qName, /([a-z_$][\w$]*):([a-z_$][\w$\-]*)/i) ||
      [qName, "", qName];

    const get = () => {
      const list: T[] = [];
      for (
        let node = this.firstElementChild;
        node;
        node = node.nextElementSibling
      ) {
        if (
          node.tagName === qName || (
            node.localName === localName &&
            (prefix === "*" || node.prefix === prefix ||
              (prefix === "" && node.prefix === null &&
                (node.namespaceURI === null ||
                  node.namespaceURI === _.constants.XHTML_NAMESPACE)))
          )
        ) _.push(list, node);
      }
      return list;
    };
    return createHTMLCollection(this, get, "getElementsByTagName");
  }

  static {
    _.DocumentOrShadowRoot = {
      getActiveElement: (target) => target.#activeElement,
      setActiveElement: (target, element) => {
        target.#activeElement = element || null;
        return target;
      },
      getFullscreenElement: (target) => target.#fullscreenElement,
      setFullscreenElement: (target, element) => {
        target.#fullscreenElement = element || null;
        return target;
      },
      getPointerLockElement: (target) => target.#pointerLockElement,
      setPointerLockElement: (target, element) => {
        target.#pointerLockElement = element || null;
        return target;
      },
    };
  }
}

const DocumentOrShadowRootPrototype = _.webidl.createBranded(
  DocumentOrShadowRoot.prototype,
);
