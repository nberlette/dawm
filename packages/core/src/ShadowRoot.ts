/**
 * The `ShadowRoot` class represents the root of a shadow DOM tree.
 *
 * ## Overview
 *
 * A shadow root is a special type of DOM node that serves as the root of a
 * "shadow" DOM tree: a separate, **encapsulated** subtree of DOM elements that
 * is attached to a host element in the main document's DOM tree.
 *
 * ## Purpose and Benefits
 *
 * The primary purpose and benefit of a shadow root is to provide complete
 * encapsulation for DOM and CSS, allowing developers to create reusable
 * components with isolated styles and behavior.
 *
 * ## Shadow Root Mode: `open` vs. `closed`
 *
 * The `mode` property indicates whether the shadow root is open ahd accessible
 * via typical JavaScript APIs (like a regular Element), or encapsulated into a
 * closed state. You can specify the `mode` as a property in an options bag and
 * pass it to the {@linkcode Element.attachShadow} method, to create and attach
 * a shadow root with the desired mode to the host element it is called on.
 *
 * Open shadow roots allow developers to interact with the shadow DOM from
 * outside the component (usually through the {@linkcode Element.shadowRoot}
 * property, or the result of calling the {@linkcode Element.attachShadow}
 * method). while closed shadow roots prevent any access to their internal
 * structure from outside the scope of the component itself.
 *
 * ## Inheritance
 *
 * The `ShadowRoot` class extends the {@linkcode DocumentOrShadowRoot} abstract
 * class, which provides common properties and methods for both `Document` and
 * `ShadowRoot` objects, such as `querySelector`, `getElementById`, and others.
 * Under the hood, however, `ShadowRoot` instances inherit not from the actual
 * `Document` class, but from a custom version of {@linkcode DocumentFragment};
 * this is because the shadow root is conceptually a fragment of the document,
 * and it does not have all the capabilities of a full document (e.g. it cannot
 * be serialized to a string, does not have a `documentElement`, etc.).
 *
 * ## Instantiation
 *
 * The `ShadowRoot` class is not intended to be instantiated directly, and will
 * throw an error if you try to create an instance using `new ShadowRoot()` or
 * similar. Instead, call the {@linkcode Element.attachShadow} method on a host
 * element (typically a custom element / web component) to create and attach a
 * shadow root to that element, and the method will return the newly created
 * `ShadowRoot` instance.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot for the MDN
 * Reference on this API and shadow DOM in general.
 * @see https://dom.spec.whatwg.org/#shadow-root for the official WHATWG
 * specification on shadow DOM.
 * @see https://github.com/nberlette/dawm/#readme for more info about dawm.
 * @module ShadowRoot
 */
import { _, SymbolToStringTag } from "dawm-internal";
import { DocumentOrShadowRoot } from "./DocumentOrShadowRoot.ts";
import { DocumentFragment } from "./DocumentFragment.ts";
import { Element } from "./Element.ts";
import { CustomElementRegistry } from "dawm-html/components/custom-element-registry";

declare module "dawm-internal" {
  export interface ShadowRootInternal extends DocumentFragmentInternal {
    new: (mode?: ShadowRootMode) => ShadowRoot;

    getMode(instance: ShadowRoot): ShadowRootMode;
    setMode(instance: ShadowRoot, mode: ShadowRootMode): ShadowRoot;
    getHost(instance: ShadowRoot): Element | null;
    setHost(instance: ShadowRoot, host: Element | null): ShadowRoot;
    getSlotAssignment(instance: ShadowRoot): SlotAssignmentMode;
    setSlotAssignment(
      instance: ShadowRoot,
      mode: SlotAssignmentMode,
    ): ShadowRoot;
    getCustomElementRegistry(
      instance: ShadowRoot,
    ): CustomElementRegistry | null;
    setCustomElementRegistry(
      instance: ShadowRoot,
      registry: CustomElementRegistry | null,
    ): ShadowRoot;
    getKeepCustomElementRegistryNull(instance: ShadowRoot): boolean;
    setKeepCustomElementRegistryNull(
      instance: ShadowRoot,
      keepNull: boolean,
    ): ShadowRoot;
    getClonable(instance: ShadowRoot): boolean;
    setClonable(instance: ShadowRoot, clonable: boolean): ShadowRoot;
    getDeclarative(instance: ShadowRoot): boolean;
    setDeclarative(instance: ShadowRoot, declarative: boolean): ShadowRoot;
    getSerializable(instance: ShadowRoot): boolean;
    setSerializable(instance: ShadowRoot, serializable: boolean): ShadowRoot;
    getDelegatesFocus(instance: ShadowRoot): boolean;
    setDelegatesFocus(
      instance: ShadowRoot,
      delegatesFocus: boolean,
    ): ShadowRoot;
  }

  export interface internal {
    ShadowRoot: ShadowRootInternal;
  }
}

/**
 * Represents the values of the `mode` property of a `ShadowRoot` instance,
 * as well as the `mode` option for the optional options bag accepted by the
 * {@linkcode Element.attachShadow} method when creating and attaching a shadow
 * root to a host element.
 *
 * @category Types
 * @tags ShadowRoot
 */
export type ShadowRootMode = "open" | "closed";

/**
 * Represents the values of the `slotAssignment` property of a `ShadowRoot`
 * instance, as well as the `slotAssignment` option for the optional options bag
 * accepted by the {@linkcode Element.attachShadow} method when creating and
 * attaching a shadow root to a host element.
 *
 * @category Types
 * @tags ShadowRoot
 */
export type SlotAssignmentMode = "manual" | "named";

const $ShadowRootBase = _.mixin(DocumentFragment, DocumentOrShadowRoot);

interface ShadowRootBase extends InstanceType<typeof $ShadowRootBase> {}

type ShadowRootBaseConstructor = typeof $ShadowRootBase & {
  new (): ShadowRootBase;
};

const ShadowRootBase: ShadowRootBaseConstructor = $ShadowRootBase;

export interface ShadowRoot extends ShadowRootBase {}

/**
 * The `ShadowRoot` class represents the root of a shadow DOM tree, which is a
 * separate, encapsulated subtree of DOM elements that is attached to a host
 * element in the main document's DOM tree. It provides complete encapsulation
 * for DOM and CSS, allowing developers to create reusable components with
 * isolated styles and behavior.
 *
 * See the module-level documentation for more details about the `ShadowRoot`
 * class along with some brief explanations of the concepts/features related to
 * shadow DOM in general. For more in-depth information about shadow DOM, see
 * the linked MDN and WHATWG references below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot for the MDN
 * Reference on this API and shadow DOM in general.
 * @see https://dom.spec.whatwg.org/#interface-shadowroot for the official
 * WHATWG specification on shadow DOM.
 */
export class ShadowRoot extends $ShadowRootBase {
  #clonable = false;
  #declarative = false;
  #serializable = false;
  #delegatesFocus = false;
  #customElementRegistry: CustomElementRegistry | null = null;
  #keepCustomElementRegistryNull = false;
  #host: Element | null = null;
  #mode: ShadowRootMode = "open";
  #slotAssignment: SlotAssignmentMode = "named";

  constructor() {
    super();
    _.enforcePrivateConstructor({ arguments });
  }

  get mode(): ShadowRootMode {
    return this.#mode;
  }

  get slotAssignment(): SlotAssignmentMode {
    return this.#slotAssignment;
  }

  get delegatesFocus(): boolean {
    return this.#delegatesFocus;
  }

  get host(): Element | null {
    return this.#host;
  }

  get serializable(): boolean {
    return this.#serializable;
  }

  get clonable(): boolean {
    return this.#clonable;
  }

  declare readonly [SymbolToStringTag]: "ShadowRoot";

  static {
    _.toStringTag("ShadowRoot")(this);
  }

  static {
    _.ShadowRoot = {
      new: ({
        mode = "open",
        slotAssignment = "named",
        clonable = false,
        declarative = false,
        serializable = false,
        delegatesFocus = false,
        customElementRegistry = null,
        keepCustomElementRegistryNull = false,
      }) => {
        const shadow = new (ShadowRoot as any)(_.keys._private);
        shadow.#mode = mode === "open" ? mode : "closed";
        return shadow;
      },
      getMode: (i) => i.#mode,
      setMode: (i, m) => (i.#mode = m === "open" ? m : "closed", i),
    };
  }
}
