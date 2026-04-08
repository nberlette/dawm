import { ObjectDefineProperty } from "../../internal/primordials.ts";
import { XMLHttpRequestEventTarget } from "./XMLHttpRequestEventTarget.ts";
import { kUploadBrand } from "./_helpers.ts";

/**
 * Represents the upload process for a specific {@linkcode XMLHttpRequest}. It
 * is an _opaque_ object that represents the underlying, runtime-dependent,
 * upload process. It is an {@linkcode XMLHttpRequestEventTarget} and can be
 * obtained by calling {@linkcode XMLHttpRequest.upload}.
 */
export class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
  declare readonly [kUploadBrand]: kUploadBrand;

  static {
    ObjectDefineProperty(this.prototype, kUploadBrand, {
      __proto__: null,
      get() {
        return kUploadBrand;
      },
      set() {},
      enumerable: true,
      configurable: false,
    } as PropertyDescriptor);
  }
}
