import { _ } from "dawm-internal";
import { File, toFile } from "dawm-fetch/file";

export type DataTransferItemKind = "string" | "file";

export interface FunctionStringCallback {
  (data: string | null): void;
}

interface NativeDataTransferItemLike {
  readonly kind: string;
  readonly type: string;
  getAsFile(): unknown;
  getAsString(callback: (data: string) => void): void;
  webkitGetAsEntry?(): unknown;
}

declare module "dawm-internal" {
  export interface DataTransferItemInternal {
    newString: (type: string, value: string) => DataTransferItem;
    newFile: (file: File) => DataTransferItem;
    fromNative: (item: NativeDataTransferItemLike) => DataTransferItem;
    getNative(item: DataTransferItem): NativeDataTransferItemLike | null;
    setNative(
      item: DataTransferItem,
      nativeItem: NativeDataTransferItemLike | null,
    ): DataTransferItem;
    getKind(item: DataTransferItem): DataTransferItemKind;
    setKind(
      item: DataTransferItem,
      kind: DataTransferItemKind,
    ): DataTransferItem;
    getType(item: DataTransferItem): string;
    setType(item: DataTransferItem, type: string): DataTransferItem;
    getStringValue(item: DataTransferItem): string | null;
    setStringValue(
      item: DataTransferItem,
      value: string | null,
    ): DataTransferItem;
    getFileValue(item: DataTransferItem): File | null;
    setFileValue(item: DataTransferItem, value: File | null): DataTransferItem;
  }

  export interface internal {
    DataTransferItem: DataTransferItemInternal;
  }
}

function looksNativeItem(value: unknown): value is NativeDataTransferItemLike {
  return !!value && typeof value === "object" &&
    typeof (value as { kind?: unknown }).kind === "string" &&
    typeof (value as { type?: unknown }).type === "string" &&
    typeof (value as { getAsFile?: unknown }).getAsFile === "function" &&
    typeof (value as { getAsString?: unknown }).getAsString === "function";
}

/**
 * Runtime-agnostic DataTransferItem implementation with native delegation.
 */
export class DataTransferItem {
  #nativeItem: NativeDataTransferItemLike | null = null;
  #kind: DataTransferItemKind = "string";
  #type = "";
  #stringValue: string | null = null;
  #fileValue: File | null = null;

  constructor(kind: DataTransferItemKind, type: string, value: string | File);
  constructor(nativeItem: NativeDataTransferItemLike);
  constructor(
    kindOrNative: DataTransferItemKind | NativeDataTransferItemLike,
    type?: string,
    value?: string | File,
  ) {
    if (looksNativeItem(kindOrNative)) {
      this.#nativeItem = kindOrNative;
      this.#kind = kindOrNative.kind === "file" ? "file" : "string";
      this.#type = kindOrNative.type;
      return;
    }

    this.#kind = kindOrNative;
    this.#type = (type ?? "").toLowerCase();
    if (kindOrNative === "file") {
      this.#fileValue = toFile(value) ?? null;
      this.#stringValue = null;
    } else {
      this.#stringValue = String(value ?? "");
      this.#fileValue = null;
    }
  }

  get kind(): DataTransferItemKind {
    return this.#nativeItem?.kind === "file" ? "file" : this.#kind;
  }

  get type(): string {
    return this.#nativeItem?.type ?? this.#type;
  }

  getAsFile(): File | null {
    if (this.#nativeItem) {
      return toFile(this.#nativeItem.getAsFile());
    }

    return this.kind === "file" ? this.#fileValue : null;
  }

  getAsString(callback: FunctionStringCallback | null): void {
    if (typeof callback !== "function") {
      return;
    }

    if (this.#nativeItem) {
      this.#nativeItem.getAsString((data) => callback(data));
      return;
    }

    if (this.kind === "string") {
      queueMicrotask(() => callback(this.#stringValue ?? ""));
    } else {
      queueMicrotask(() => callback(null));
    }
  }

  webkitGetAsEntry(): unknown {
    return this.#nativeItem?.webkitGetAsEntry?.() ?? null;
  }

  get [Symbol.toStringTag](): "DataTransferItem" {
    return "DataTransferItem";
  }

  static {
    _.DataTransferItem = {
      newString: (type, value) => new DataTransferItem("string", type, value),
      newFile: (file) => new DataTransferItem("file", file.type, file),
      fromNative: (item) => new DataTransferItem(item),
      getNative: (item) => item.#nativeItem,
      setNative: (
        item,
        nativeItem,
      ) => (item.#nativeItem = nativeItem, item),
      getKind: (item) => item.#kind,
      setKind: (item, kind) => (item.#kind = kind, item),
      getType: (item) => item.#type,
      setType: (item, type) => (item.#type = type.toLowerCase(), item),
      getStringValue: (item) => item.#stringValue,
      setStringValue: (
        item,
        value,
      ) => (item.#stringValue = value, item),
      getFileValue: (item) => item.#fileValue,
      setFileValue: (item, value) => (item.#fileValue = value, item),
    };
  }
}
