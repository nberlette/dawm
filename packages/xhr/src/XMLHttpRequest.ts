import type { Document } from "dawm-core/document";
import { DOMParser } from "dawm-core/dom-parser";
import { DOMException } from "dawm-core/dom-exception";
import { XMLDocument } from "dawm-xml/xml-document";
import {
  $globalThis,
  _,
  FunctionPrototypeCall,
  isError,
  SymbolToStringTag,
} from "dawm-internal";
import {
  appendBytes,
  assert,
  contentType,
  extractLength,
  extractMIMEType,
  getCharset,
  isForbidden,
  isHTMLMIMEType,
  isXMLMIMEType,
  normalize,
  parseJSONFromBytes,
  State,
} from "./_helpers.ts";
import { XMLHttpRequestEventTarget } from "./XMLHttpRequestEventTarget.ts";
import { XMLHttpRequestUpload } from "./XMLHttpRequestUpload.ts";
import { Event } from "dawm-core/events/event";
import { ProgressEvent } from "dawm-core/events/progress-event";

export type XMLHttpRequestResponseType =
  | ""
  | "arraybuffer"
  | "blob"
  | "document"
  | "json"
  | "text";

/**
 * XMLHttpRequest (XHR) objects are used to interact with servers. You can
 * retrieve data from a URL without having to do a full page refresh. This
 * enables a Web page to update just part of a page without disrupting what the
 * user is doing.
 *
 * Despite its name, `XMLHttpRequest` can be used to retrieve any type of data,
 * not just XML.
 */
export class XMLHttpRequest extends XMLHttpRequestEventTarget {
  #abortedFlag = false;
  #abortController?: AbortController;
  #crossOriginCredentials = false;
  #headers = new Headers();
  #mime?: string;
  #receivedBytes = new Uint8Array();
  #requestMethod?: string;
  #response?: Response;
  #responseObject: any = null;
  #responseType: XMLHttpRequestResponseType = "";
  #responseDoc: Document | null = null;
  #sendFlag = false;
  #state = State.UNSENT;
  #timedoutFlag = false;
  #timeout = 0;
  #upload = new XMLHttpRequestUpload();
  #uploadCompleteFlag = false;
  #uploadListener = false;
  #url?: URL;

  #getResponseMIMEType = () => {
    try {
      assert(this.#response);
      const mimeType = extractMIMEType(this.#response.headers);
      return mimeType;
    } catch {
      return "text/xml";
    }
  };

  #getFinalMIMEType = () => {
    if (!this.#mime) {
      return this.#getResponseMIMEType();
    } else {
      return this.#mime;
    }
  };

  #getFinalEncoding = () => {
    return getCharset(this.#getFinalMIMEType())?.toLocaleLowerCase() ?? null;
  };

  #getTextResponse = () => {
    if (this.#response?.body == null) {
      return "";
    }
    let charset = this.#getFinalEncoding();
    if (
      this.#responseType === "" && charset == null &&
      isXMLMIMEType(this.#getFinalMIMEType())
    ) {
      charset = "utf-8";
    }
    charset = charset ?? "utf8";
    const decoder = new TextDecoder(charset);
    return decoder.decode(this.#receivedBytes);
  };

  #handleResponseEndOfBody = () => {
    assert(this.#response);
    const loaded = this.#receivedBytes.length;
    const total = extractLength(this.#response) ?? 0;
    this.dispatchEvent(new ProgressEvent("progress", { loaded, total }));
    this.#state = State.DONE;
    this.#sendFlag = false;
    this.dispatchEvent(new Event("readystatechange"));
    this.dispatchEvent(new ProgressEvent("load", { loaded, total }));
    this.dispatchEvent(new ProgressEvent("loadend", { loaded, total }));
  };

  #handleErrors = () => {
    if (!this.#sendFlag) {
      return;
    }
    if (this.#timedoutFlag) {
      this.#requestErrorSteps("timeout");
    } else if (this.#abortedFlag) {
      this.#requestErrorSteps("abort");
    } else {
      this.#requestErrorSteps("error");
    }
  };

  #requestErrorSteps = (event: string) => {
    this.#state = State.DONE;
    this.#sendFlag = false;
    this.dispatchEvent(new Event("readystatechange"));
    if (!this.#uploadCompleteFlag) {
      this.#uploadCompleteFlag = true;
      if (this.#uploadListener) {
        this.#upload.dispatchEvent(
          new ProgressEvent(event, { loaded: 0, total: 0 }),
        );
        this.#upload.dispatchEvent(
          new ProgressEvent("loadend", { loaded: 0, total: 0 }),
        );
      }
    }
    this.dispatchEvent(new ProgressEvent(event, { loaded: 0, total: 0 }));
    this.dispatchEvent(new ProgressEvent("loadend", { loaded: 0, total: 0 }));
  };

  #setDocumentResponse = () => {
    assert(this.#response);
    if (this.#response.body == null) {
      return;
    }
    const finalMIME = this.#getFinalMIMEType();
    const src = this.#getTextResponse();
    if (isHTMLMIMEType(finalMIME)) {
      if (this.#responseType === "") return;
      this.#responseObject = this.#responseDoc = new DOMParser({
        quirksMode: "limited-quirks",
      }).parseFromString(src, "text/html");
    } else if (isXMLMIMEType(finalMIME)) {
      this.#responseObject = this.#responseDoc = new DOMParser()
        .parseFromString(
          src,
          "application/xml",
        );
    }
  };

  #terminate = () => {
    if (this.#abortController) {
      try {
        this.#abortController.abort();
      } catch {
        // just swallowing errors here
      }
      this.#abortController = undefined;
    }
  };

  #onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null = null;

  get onreadystatechange(): ((this: XMLHttpRequest, ev: Event) => any) | null {
    return this.#onreadystatechange;
  }

  set onreadystatechange(
    handler: ((this: XMLHttpRequest, ev: Event) => any) | null,
  ) {
    // if (typeof handler !== "function" && handler != null) {
    //   const name = this.constructor.name || "XMLHttpRequest";
    //   throw new DOMException(
    //     `Failed to set 'onreadystatechange' on '${name}': event handler must be a callback function or null`,
    //     "TypeMismatchError",
    //   );
    // }
    const callback = _.webidl.converters["EventHandler?"](handler, {
      prefix: `Failed to set 'onreadystatechange' on 'XMLHttpRequest'`,
      context: "handler",
    });
    this.#onreadystatechange = callback ?? null;
  }

  get readyState(): number {
    return this.#state;
  }

  get response(): any {
    if (this.#responseType === "" || this.#responseType === "text") {
      if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
        return "";
      }
      return this.#getTextResponse();
    }
    if (this.#state !== State.DONE || isError(this.#responseObject)) {
      return null;
    }
    if (this.#responseObject != null) {
      return this.#responseObject;
    }
    if (this.#responseType === "arraybuffer") {
      try {
        this.#responseObject = this.#receivedBytes.buffer.slice(
          this.#receivedBytes.byteOffset,
          this.#receivedBytes.byteLength + this.#receivedBytes.byteOffset,
        );
      } catch (e) {
        this.#responseObject = e;
        return null;
      }
    } else if (this.#responseType === "blob") {
      this.#responseObject = new Blob([this.#receivedBytes], {
        type: this.#getFinalMIMEType(),
      });
    } else if (this.#responseType === "document") {
      this.#setDocumentResponse();
    } else {
      assert(this.#responseType === "json");
      if (this.#response?.body == null) {
        return null;
      }
      let jsonObject;
      try {
        jsonObject = parseJSONFromBytes(this.#receivedBytes);
      } catch {
        return null;
      }
      this.#responseObject = jsonObject;
    }
    return isError(this.#responseObject) ? null : this.#responseObject;
  }

  get responseText(): string {
    if (!(this.#responseType === "" || this.#responseType === "text")) {
      throw new DOMException(
        "Response type is not set properly",
        "InvalidStateError",
      );
    }
    if (!(this.#state === State.LOADING || this.#state === State.DONE)) {
      return "";
    }
    return this.#getTextResponse();
  }

  get responseType(): XMLHttpRequestResponseType {
    return this.#responseType;
  }

  set responseType(value: XMLHttpRequestResponseType) {
    if (this.#state === State.LOADING || this.#state === State.DONE) {
      throw new DOMException(
        "The response type cannot be changed when loading or done",
        "InvalidStateError",
      );
    }
    this.#responseType = value;
  }

  get responseURL(): string {
    return this.#response?.url ?? "";
  }

  get responseXML(): XMLDocument | null {
    if (!(this.#responseType === "" || this.#responseType === "document")) {
      throw new DOMException(
        "Response type is not properly set",
        "InvalidStateError",
      );
    }
    if (this.#state !== State.DONE || isError(this.#responseObject)) {
      return null;
    }
    this.#setDocumentResponse();
    return this.#responseDoc as XMLDocument;
  }

  get status(): number {
    return this.#response?.status ?? 0;
  }

  get statusText(): string {
    return this.#response?.statusText ?? "";
  }

  get timeout(): number {
    return this.#timeout;
  }

  set timeout(value: number) {
    this.#timeout = value;
  }

  get upload(): XMLHttpRequestUpload {
    return this.#upload;
  }

  get withCredentials(): boolean {
    return this.#crossOriginCredentials;
  }

  set withCredentials(value: boolean) {
    if (
      !(this.#state === State.UNSENT || this.#state === State.OPENED)
    ) {
      throw new DOMException(
        "The request is not unsent or opened",
        "InvalidStateError",
      );
    }
    if (this.#sendFlag) {
      throw new DOMException("The request has been sent", "InvalidStateError");
    }
    this.#crossOriginCredentials = value;
  }

  abort(): void {
    this.#terminate();
    if (
      (this.#state === State.OPENED && this.#sendFlag) ||
      this.#state === State.HEADERS_RECEIVED ||
      this.#state === State.LOADING
    ) this.#requestErrorSteps("abort");
    if (this.#state === State.DONE) {
      this.#state = State.UNSENT;
      this.#response = undefined;
    }
  }

  override dispatchEvent(evt: Event): boolean {
    switch (evt.type) {
      case "readystatechange":
        if (this.onreadystatechange) {
          FunctionPrototypeCall(this.onreadystatechange, this, evt);
        }
        break;
    }
    if (evt.cancelable && evt.defaultPrevented) {
      return false;
    } else {
      return super.dispatchEvent(evt);
    }
  }

  getAllResponseHeaders(): string | null {
    if (!this.#response) {
      return null;
    }
    const headers = [...this.#response.headers];
    headers.sort(([a], [b]) => a.localeCompare(b));
    return headers.map(([key, value]) => `${key}: ${value}`).join("\r\n");
  }

  getResponseHeader(name: string): string | null {
    return this.#response?.headers.get(name) ?? null;
  }

  open(
    method: string,
    url: string,
    async = true,
    username: string | null = null,
    password: string | null = null,
  ): void {
    if (typeof method !== "string") {
      throw new DOMException("The method is invalid", "SyntaxError");
    }
    if (isForbidden(method)) {
      throw new DOMException(
        `The method "${method}" is forbidden.`,
        "SecurityError",
      );
    }
    method = normalize(method);
    let parsedUrl: URL;
    try {
      let base: string | undefined;
      try {
        base = $globalThis.location.toString();
      } catch {
        // we just want to avoid the error about location in Deno
      }
      parsedUrl = new URL(url, base);
    } catch {
      throw new DOMException(`The url "${url}" is invalid.`, "SyntaxError");
    }
    if (username != null) parsedUrl.username = username;
    if (password != null) parsedUrl.password = password;
    if (!async) {
      throw new DOMException(
        "Synchronous XHR is not supported in this context.",
        "InvalidAccessError",
      );
    }
    this.#terminate();
    this.#sendFlag = false;
    this.#uploadListener = false;
    this.#requestMethod = method;
    this.#url = parsedUrl;
    this.#headers = new Headers();
    this.#response = undefined;
    this.#state = State.OPENED;
    this.dispatchEvent(new Event("readystatechange"));
  }

  overrideMimeType(mime: string): void {
    if (this.#state === State.LOADING || this.#state === State.DONE) {
      throw new DOMException(
        "The request is in an invalid state",
        "InvalidStateError",
      );
    }
    this.#mime = contentType(mime) ?? "application/octet-stream";
  }

  send(body: BodyInit | null = null): void {
    if (this.#state !== State.OPENED || this.#sendFlag) {
      throw new DOMException("Invalid state", "InvalidStateError");
    }
    if (this.#requestMethod === "GET" || this.#requestMethod === "HEAD") {
      body = null;
    }
    const abortController = this.#abortController = new AbortController();
    const req = new Request(this.#url!.toString(), {
      method: this.#requestMethod,
      headers: this.#headers,
      body,
      mode: "cors",
      credentials: this.#crossOriginCredentials ? "include" : "same-origin",
      signal: abortController.signal,
    });
    this.#uploadCompleteFlag = false;
    this.#timedoutFlag = false;
    if (req.body == null) {
      this.#uploadCompleteFlag = true;
    }
    this.#sendFlag = true;

    this.dispatchEvent(new ProgressEvent("loadstart", { loaded: 0, total: 0 }));
    this.#upload.dispatchEvent(
      new ProgressEvent("loadstart", { loaded: 0, total: 0 }),
    );
    if (this.#state !== State.OPENED || !this.#sendFlag) {
      return;
    }
    const processRequestEndOfBody = () => {
      this.#uploadCompleteFlag = true;
      if (!this.#uploadListener) {
        return;
      }
      this.#upload.dispatchEvent(
        new ProgressEvent("progress", { loaded: 0, total: 0 }),
      );
      this.#upload.dispatchEvent(
        new ProgressEvent("load", {
          loaded: 0,
          total: 0,
        }),
      );
      this.#upload.dispatchEvent(
        new ProgressEvent("loadend", { loaded: 0, total: 0 }),
      );
    };
    const processResponse = async (response: Response) => {
      this.#response = response;
      this.#state = State.HEADERS_RECEIVED;
      this.dispatchEvent(new Event("readystatechange"));
      if (this.#state !== State.HEADERS_RECEIVED) {
        return;
      }
      if (response.body == null) {
        this.#handleResponseEndOfBody();
        return;
      }
      const total = extractLength(this.#response) ?? 0;
      const processBodyChunk = (bytes: Uint8Array<ArrayBuffer>) => {
        this.#receivedBytes = appendBytes(this.#receivedBytes, bytes);
        // the specification indicates that this should return if last invoked
        // was <= 50ms ago, the problem is that often chunks arrive under that
        // and a client doesn't get a progress event, which then causes it to
        // "hang" when long polling
        if (this.#state === State.HEADERS_RECEIVED) {
          this.#state = State.LOADING;
        }
        this.dispatchEvent(new Event("readystatechange"));
        this.dispatchEvent(
          new ProgressEvent("progress", {
            loaded: this.#receivedBytes.length,
            total,
          }),
        );
      };
      const processEndOfBody = () => {
        this.#handleResponseEndOfBody();
      };
      const processBodyError = () => {
        this.#handleErrors();
      };
      try {
        for await (const bytes of response.body) {
          processBodyChunk(bytes as Uint8Array<ArrayBuffer>);
        }
        processEndOfBody();
      } catch {
        processBodyError();
      }
    };
    const processRejection = () => {
      this.#handleErrors();
    };
    const processFullResponse = (response: Response) => {
      processRequestEndOfBody();
      return processResponse(response);
    };
    const p = fetch(req).then(processFullResponse, processRejection);
    if (this.#timeout > 0) {
      let tid = -1;
      const t = new Promise<boolean>((res) => {
        tid = setTimeout(() => res(true), this.#timeout);
      });
      Promise.race([p, t]).then((value) => {
        clearTimeout(tid);
        if (value) {
          this.#timedoutFlag = true;
          this.#terminate();
        }
      });
    }
  }

  setRequestHeader(name: string, value: string): void {
    if (this.#state !== State.OPENED || this.#sendFlag) {
      throw new DOMException("Invalid state", "InvalidateStateError");
    }
    this.#headers.append(name, value);
  }

  get DONE(): State.DONE {
    return State.DONE;
  }

  get HEADERS_RECEIVED(): State.HEADERS_RECEIVED {
    return State.HEADERS_RECEIVED;
  }

  get LOADING(): State.LOADING {
    return State.LOADING;
  }

  get OPENED(): State.OPENED {
    return State.OPENED;
  }

  get UNSENT(): State.UNSENT {
    return State.UNSENT;
  }

  declare readonly [SymbolToStringTag]: "XMLHttpRequest";

  static {
    _.toStringTag("XMLHttpRequest")(this);
  }

  static get DONE(): State.DONE {
    return State.DONE;
  }

  static get HEADERS_RECEIVED(): State.HEADERS_RECEIVED {
    return State.HEADERS_RECEIVED;
  }

  static get LOADING(): State.LOADING {
    return State.LOADING;
  }

  static get OPENED(): State.OPENED {
    return State.OPENED;
  }

  static get UNSENT(): State.UNSENT {
    return State.UNSENT;
  }
}
