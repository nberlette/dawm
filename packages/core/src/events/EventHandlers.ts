import {
  _,
  FunctionPrototypeBind,
  FunctionPrototypeCall,
  ObjectCreate,
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptors,
  ReflectGet,
  ReflectOwnKeys,
  ReflectSet,
  Set,
  StringPrototypeSlice,
  StringPrototypeStartsWith,
  WeakMap,
  WeakMapPrototypeGet,
  WeakMapPrototypeSet,
} from "dawm-internal";
import { EventTarget } from "./EventTarget.ts";
import type { Event } from "./Event.ts";

type RuntimeEventMap = {
  [K in keyof any]?: Event | (abstract new (...args: any) => Event) | null;
};
type IntoEventMap<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]-?:
    | (null extends T[K] ? null : never)
    | (T[K] extends abstract new (...args: any) => infer E ? E
      : T[K] extends Event ? T[K]
      : never);
};

export interface EventHandlersConstructor {
  readonly prototype: EventHandlers<any, any>;

  new <T extends {} = RuntimeEventMap, This = InstanceType<this>>(
    eventMap?: T,
    thisArg?: This,
  ): EventHandlers<IntoEventMap<T>, This>;
}

const weakFnCache = new WeakMap<object, WeakMap<Function, Function>>();

function proxyGet<
  T extends object,
  K extends string | symbol = (string | symbol) & keyof T,
  This extends ProxyHandler<T> = ProxyHandler<T>,
>(
  this: This,
  target: T,
  prop: K,
  receiver?: any,
): K extends keyof T ? T[K] : unknown {
  const value = ReflectGet(target, prop, receiver);
  if (typeof value === "function") {
    // memoize the bound function on the instance to ensure it has a
    // stable reference, while ensuring that the `this` context is
    // correct when called. we need to be careful not to return the
    // memoized method outside of the same instance it is bound to!
    let map = WeakMapPrototypeGet(weakFnCache, target);
    if (!map && receiver) map = WeakMapPrototypeGet(weakFnCache, receiver);
    if (!map) {
      WeakMapPrototypeSet(weakFnCache, target, map = new WeakMap());
      // allow the receiver (the proxy itself) to behave as the same cache key
      // as the original underlying object being proxied. this helps us avoid
      // issues with contextual this bindings that often arise with proxies.
      if (receiver) WeakMapPrototypeSet(weakFnCache, receiver, map);
    }
    let fn = WeakMapPrototypeGet(map, value);
    if (!fn) {
      WeakMapPrototypeSet(map, value, fn = FunctionPrototypeBind(value, self));
      // ensure we copy own props like name, length, etc. to the bound function
      ObjectDefineProperties(fn, ObjectGetOwnPropertyDescriptors(value));
    }
    return fn as never;
  }
  // return non-callable properties as-is without any caching or binding.
  return value;
}

type EventHandlerKeysOf<T> = {
  [K in keyof T]: K extends string ? K extends `on${string}` ? K : `on${K}`
    : never;
}[keyof T];

function isEventHandlerKey<T extends Record<string, any> = EventHandlersMixin>(
  key: string | symbol,
  map?: T,
): key is EventHandlerKeysOf<T> {
  return typeof key === "string" &&
    StringPrototypeStartsWith(key, "on") && key.length > 2 && (
      map == null || (
        typeof map === "object" && StringPrototypeSlice(key, 2) in map
      )
    );
}

/**
 * Dynamic generic event handler API. Used internally by various DOM APIs in
 * the `dawm` project to provide a flexible, type-safe implementation of the
 * standard event handler pattern (e.g., `onclick`, `onload`) with support for
 * pre-defined (and type-safe) runtime event maps, bound method caching, and
 * other niceties.
 *
 * By using this as a mixin, a subclass can automatically get support for any
 * event handler properties defined in its (optional) event map parameter, with
 * full type safety and correct `this` bindings, without needing to manually
 * define each property or worry about the underlying implementation details.
 *
 * @remarks
 * This class is **not** designed to be used directly. Instead, it is intended
 * to be used as a mixin base for event-driven classes looking to implement an
 * event handler API without needing to manually define and manage every single
 * event handler property on the class itself.
 *
 * @internal
 * @abstract
 */
export const EventHandlers: EventHandlersConstructor = class<
  T extends {},
  This = any,
> extends EventTarget {
  [event: `on${string}`]: ((this: This, event: Event) => void) | null;

  constructor(eventMap?: T, _thisArg?: This) {
    super();

    const self = this as this;

    const proxy = new Proxy(self, {
      get: (t, p, r) => {
        if (isEventHandlerKey(p, eventMap)) {
          const event = StringPrototypeSlice(p, 2);
          const fn = ReflectGet(eventMap ??= ObjectCreate(null), event, r);
          if (fn === null || typeof fn === "function") return fn;
          return null;
        }
        return FunctionPrototypeCall(proxyGet, self, t, p, r);
      },
      set: (t, p, v, r) => {
        if (isEventHandlerKey(p, eventMap)) {
          const event = StringPrototypeSlice(p, 2);
          if (v !== null && typeof v !== "function") {
            throw new TypeError(
              `Event handler for "${event}" must be a function or null`,
            );
          }
          return ReflectSet(eventMap ??= ObjectCreate(null), event, v, r);
        }
        return ReflectSet(t, p, v, r);
      },
      has: (t, p) => isEventHandlerKey(p, eventMap) || p in t,
      ownKeys: (t) => {
        let keys: (string | symbol)[] = ReflectOwnKeys(t);
        if (eventMap) keys = [...keys, ...ReflectOwnKeys(eventMap)];
        return [...new Set(keys)];
      },
    });

    return proxy;
  }
} as EventHandlersConstructor;

export type EventHandlers<T extends {}, This = any> =
  & {
    [
      K in keyof T as K extends string ? string extends K ? never
        : `on${string}` extends K ? K
        : Lowercase<K extends `on${string}` ? K : `on${K}`>
        : never
    ]-?: ((this: This, event: T[K]) => void) | null;
  }
  & EventHandlersMixin<This>;

export interface EventHandlersMixin<This = any> extends EventTarget {
  [event: `on${string}`]: ((this: This, event: any) => void) | null;
}
