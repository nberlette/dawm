import { FunctionPrototypeCall } from "../internal/primordials.ts";
import { XMLHttpRequest } from "./XMLHttpRequest.ts";

/**
 * The interface for event handlers for {@linkcode XMLHttpRequest} and
 * {@lincode XMLHttpRequestUpload}.
 */
export class XMLHttpRequestEventTarget extends EventTarget {
  onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
  ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;

  override dispatchEvent(evt: Event): boolean {
    if (evt instanceof ProgressEvent) {
      const xhr: XMLHttpRequest = this as any;
      switch (evt.type) {
        case "abort":
          if (this.onabort) {
            FunctionPrototypeCall(this.onabort, xhr, evt);
          }
          break;
        case "error":
          if (this.onerror) {
            FunctionPrototypeCall(this.onerror, xhr, evt);
          }
          break;
        case "load":
          if (this.onload) {
            FunctionPrototypeCall(this.onload, xhr, evt);
          }
          break;
        case "loadend":
          if (this.onloadend) {
            FunctionPrototypeCall(this.onloadend, xhr, evt);
          }
          break;
        case "loadstart":
          if (this.onloadstart) {
            FunctionPrototypeCall(this.onloadstart, xhr, evt);
          }
          break;
        case "progress":
          if (this.onprogress) {
            FunctionPrototypeCall(this.onprogress, xhr, evt);
          }
          break;
        case "timeout":
          if (this.ontimeout) {
            FunctionPrototypeCall(this.ontimeout, xhr, evt);
          }
      }
    }
    if (evt.cancelable && evt.defaultPrevented) {
      return false;
    } else {
      return super.dispatchEvent(evt);
    }
  }
}
