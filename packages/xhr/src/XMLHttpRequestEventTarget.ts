import { _, FunctionPrototypeCall } from "dawm-internal";
import type { XMLHttpRequest } from "./XMLHttpRequest.ts";
import { EventTarget } from "dawm-core/events/event-target";
import { ProgressEvent } from "dawm-core/events/progress-event";
import { DOMException } from "dawm-core/dom-exception";

declare module "dawm-internal" {
  export interface XMLHttpRequestEventTargetInternal {
    setOnabort<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOnerror<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOnload<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOnloadend<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOnloadstart<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOnprogress<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
    setOntimeout<T extends XMLHttpRequestEventTarget>(
      target: T,
      handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
    ): T;
  }

  export interface internal {
    XMLHttpRequestEventTarget: XMLHttpRequestEventTargetInternal;
  }
}

/**
 * The interface for event handlers for {@linkcode XMLHttpRequest} and
 * {@linkcode XMLHttpRequestUpload}.
 */
export abstract class XMLHttpRequestEventTarget extends EventTarget {
  #onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  #onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  #onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  #onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  #onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null =
    null;
  #onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  #ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;

  constructor() {
    super();
    _.enforcePrivateConstructor({
      arguments,
      newTarget: new.target,
      constructor: XMLHttpRequestEventTarget,
      abstract: true,
    });
    return _.webidl.createBranded(this, "XMLHttpRequestEventTarget");
  }

  get onabort(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onabort;
  }

  set onabort(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onabort' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onabort = handler ?? null;
  }

  get onerror(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onerror;
  }

  set onerror(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onerror' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onerror = handler ?? null;
  }

  get onload(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onload;
  }

  set onload(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onload' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onload = handler ?? null;
  }

  get onloadend(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onloadend;
  }

  set onloadend(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onloadend' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onloadend = handler ?? null;
  }

  get onloadstart(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onloadstart;
  }

  set onloadstart(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onloadstart' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onloadstart = handler ?? null;
  }

  get onprogress(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#onprogress;
  }

  set onprogress(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'onprogress' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#onprogress = handler ?? null;
  }

  get ontimeout(): ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    return this.#ontimeout;
  }

  set ontimeout(
    handler: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null,
  ) {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (typeof handler !== "function" && handler != null) {
      const name = this.constructor.name || "XMLHttpRequestEventTarget";
      throw new DOMException(
        `Failed to set 'ontimeout' on '${name}': event handler must be a callback function or null`,
        "TypeMismatchError",
      );
    }
    this.#ontimeout = handler ?? null;
  }

  override dispatchEvent(evt: Event): boolean {
    _.webidl.assertBranded(
      this,
      XMLHttpRequestEventTargetPrototype,
      "XMLHttpRequestEventTarget",
    );
    if (evt instanceof ProgressEvent) {
      const xhr = this as {} as XMLHttpRequest;
      const { type } = evt;
      switch (type) {
        case "abort":
        case "error":
        case "load":
        case "loadend":
        case "loadstart":
        case "progress":
        case "timeout": {
          const method = `on${type}` as const;
          const handle = xhr[method];
          if (typeof handle === "function") {
            FunctionPrototypeCall(handle, xhr, evt);
          }
        }
      }
    }

    if (evt.cancelable && evt.defaultPrevented) {
      return false;
    } else {
      return super.dispatchEvent(evt);
    }
  }

  static {
    _.toStringTag("XMLHttpRequestEventTarget")(this);
    _.XMLHttpRequestEventTarget = {
      setOnabort: (t, f) => (t.#onabort = f, t),
      setOnerror: (t, f) => (t.#onerror = f, t),
      setOnload: (t, f) => (t.#onload = f, t),
      setOnloadend: (t, f) => (t.#onloadend = f, t),
      setOnloadstart: (t, f) => (t.#onloadstart = f, t),
      setOnprogress: (t, f) => (t.#onprogress = f, t),
      setOntimeout: (t, f) => (t.#ontimeout = f, t),
    };
  }
}

const XMLHttpRequestEventTargetPrototype = XMLHttpRequestEventTarget.prototype;
