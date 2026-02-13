import { isString } from "../_internal.ts";
import { _, type OwnerElement } from "./_common.ts";
import {
  ObjectDefineProperty,
  ReflectDeleteProperty,
  ReflectGet,
  ReflectGetOwnPropertyDescriptor,
  ReflectHas,
  ReflectOwnKeys,
} from "../internal/primordials.ts";

/**
 * Used by the dataset HTML attribute to represent data for custom attributes
 * added to elements.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMStringMap)
 *
 * @category Collections
 */

export class DOMStringMap {
  constructor(ownerElement?: OwnerElement | null) {
    const data: Record<string, string | undefined> = { __proto__: null! };
    if (ownerElement?.attributes) {
      for (const attr of ownerElement.attributes) {
        if (attr.name.startsWith("data-")) {
          const rhs = attr.name.slice(5);
          const key = rhs.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          data[key] = attr.value;
        }
      }
    }
    _.DOMStringMap.ensure(this, data, ownerElement);

    return new Proxy(this, {
      get: (t, p, r) =>
        ReflectHas(t, p)
          ? ReflectGet(t, p)
          : isString(p)
          ? _.DOMStringMap.get(t, p)
          : ReflectGet(t, p, r),
      has: (t, p) => isString(p) ? _.DOMStringMap.has(t, p) : ReflectHas(t, p),
      set: (t, p, v) => _.DOMStringMap.set(t, String(p), v as string | null),
      deleteProperty: (t, p) =>
        isString(p) ? _.DOMStringMap.delete(t, p) : ReflectDeleteProperty(t, p),
      ownKeys: (t) => {
        const keys = ReflectOwnKeys(t);
        const data = _.DOMStringMap.getData(t);
        const props = Object.keys(data);
        return [...new Set([...keys, ...props])];
      },
      getOwnPropertyDescriptor: (t, p) => {
        if (isString(p) && _.DOMStringMap.has(t, p)) {
          return {
            value: _.DOMStringMap.get(t, p),
            writable: true,
            enumerable: true,
            configurable: true,
          };
        }
        return ReflectGetOwnPropertyDescriptor(t, p);
      },
    });
  }

  [name: string]: string | undefined;

  static {
    // ensure this class only creates plain objects
    ObjectDefineProperty(this.prototype, "constructor", { value: Object });
  }
}
