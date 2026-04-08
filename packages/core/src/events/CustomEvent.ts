import { _ } from "dawm-internal";
import { Event } from "./Event.ts";

declare module "dawm-internal" {
  export interface CustomEventInternal extends EventInternal {
    new: <T>(type: string, init?: CustomEventInit<T>) => CustomEvent<T>;

    getDetail<T>(event: CustomEvent<T>): T;
    setDetail<T>(event: CustomEvent<T>, detail: T): CustomEvent<T>;
  }

  export interface internal {
    CustomEvent: CustomEventInternal;
  }
}

export interface CustomEventInit<T = any> extends EventInit {
  detail?: T;
}

/**
 * @see https://dom.spec.whatwg.org/#interface-customevent
 */
export class CustomEvent<T = any> extends Event {
  #detail!: T;

  constructor(type: string, init?: CustomEventInit<T>) {
    super(type, init);
    _.CustomEvent.setDetail(this, init?.detail ?? null);
  }

  get detail(): T {
    _.webidl.assertBranded(this, CustomEventPrototype);
    return _.CustomEvent.getDetail(this);
  }

  set detail(value: T) {
    _.webidl.assertBranded(this, CustomEventPrototype);
    _.CustomEvent.setDetail(this, value);
  }

  initCustomEvent(
    type: string,
    bubbles?: boolean,
    cancelable?: boolean,
    detail?: T,
  ): void {
    super.initEvent(type, bubbles, cancelable);
    _.CustomEvent.setDetail(this, detail ?? null);
  }

  static {
    _.CustomEvent = {
      __proto__: null,
      ..._.Event,
      new(type, init) {
        return _.webidl.createBranded(
          new CustomEvent(type, init),
        );
      },
      getDetail(event) {
        return event.#detail;
      },
      setDetail(event, detail) {
        event.#detail = detail;
        return event;
      },
    } as typeof _.CustomEvent;
  }
}

const CustomEventPrototype = CustomEvent.prototype;
