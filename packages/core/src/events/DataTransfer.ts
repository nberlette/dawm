import { _ } from "dawm-internal";
import type { Element } from "dawm-core/element";
import { FileList } from "./FileList.ts";
import { DataTransferItemList } from "./DataTransferItemList.ts";

export type DataTransferDropEffect = "none" | "copy" | "link" | "move";
export type DataTransferEffectAllowed =
  | "none"
  | "copy"
  | "copyLink"
  | "copyMove"
  | "link"
  | "linkMove"
  | "move"
  | "all"
  | "uninitialized";

interface NativeDataTransferLike {
  dropEffect: DataTransferDropEffect;
  effectAllowed: DataTransferEffectAllowed;
  readonly files: unknown;
  readonly items: unknown;
  readonly types: ReadonlyArray<string>;
  clearData(format?: string): void;
  getData(format: string): string;
  setData(format: string, data: string): void;
  setDragImage(image: unknown, x: number, y: number): void;
}

declare module "dawm-internal" {
  export interface DataTransferInternal {
    new: () => DataTransfer;
    getNative(dataTransfer: DataTransfer): NativeDataTransferLike | null;
    setNative(
      dataTransfer: DataTransfer,
      native: NativeDataTransferLike | null,
    ): DataTransfer;
    getItems(dataTransfer: DataTransfer): DataTransferItemList;
    setItems(
      dataTransfer: DataTransfer,
      items: DataTransferItemList,
    ): DataTransfer;
    getDropEffect(dataTransfer: DataTransfer): DataTransferDropEffect;
    setDropEffect(
      dataTransfer: DataTransfer,
      value: DataTransferDropEffect,
    ): DataTransfer;
    getEffectAllowed(dataTransfer: DataTransfer): DataTransferEffectAllowed;
    setEffectAllowed(
      dataTransfer: DataTransfer,
      value: DataTransferEffectAllowed,
    ): DataTransfer;
  }

  export interface internal {
    DataTransfer: DataTransferInternal;
  }
}

const DROP_EFFECT_VALUES = new Set<DataTransferDropEffect>([
  "none",
  "copy",
  "link",
  "move",
]);

const EFFECT_ALLOWED_VALUES = new Set<DataTransferEffectAllowed>([
  "none",
  "copy",
  "copyLink",
  "copyMove",
  "link",
  "linkMove",
  "move",
  "all",
  "uninitialized",
]);

function getNativeDataTransferCtor():
  | (new () => NativeDataTransferLike)
  | null {
  const value = (globalThis as Record<string, unknown>).DataTransfer;
  return typeof value === "function"
    ? value as new () => NativeDataTransferLike
    : null;
}

function normalizeFormat(format: string): string {
  return String(format).toLowerCase();
}

/**
 * Runtime-agnostic DataTransfer implementation with native delegation.
 */
export class DataTransfer {
  #nativeDataTransfer: NativeDataTransferLike | null = null;
  #items: DataTransferItemList = new DataTransferItemList();
  #dropEffect: DataTransferDropEffect = "none";
  #effectAllowed: DataTransferEffectAllowed = "uninitialized";

  constructor() {
    const nativeCtor = getNativeDataTransferCtor();
    if (nativeCtor) {
      try {
        this.#nativeDataTransfer = new nativeCtor();
        const nativeItems = this.#nativeDataTransfer.items;
        if (nativeItems) {
          _.DataTransferItemList.setNative(this.#items, nativeItems as never);
        }
      } catch {
        // fallback state above.
      }
    }
  }

  get dropEffect(): DataTransferDropEffect {
    return this.#nativeDataTransfer?.dropEffect ?? this.#dropEffect;
  }

  set dropEffect(value: DataTransferDropEffect) {
    if (!DROP_EFFECT_VALUES.has(value)) {
      value = "none";
    }

    if (this.#nativeDataTransfer) {
      this.#nativeDataTransfer.dropEffect = value;
    } else {
      this.#dropEffect = value;
    }
  }

  get effectAllowed(): DataTransferEffectAllowed {
    return this.#nativeDataTransfer?.effectAllowed ?? this.#effectAllowed;
  }

  set effectAllowed(value: DataTransferEffectAllowed) {
    if (!EFFECT_ALLOWED_VALUES.has(value)) {
      value = "uninitialized";
    }

    if (this.#nativeDataTransfer) {
      this.#nativeDataTransfer.effectAllowed = value;
    } else {
      this.#effectAllowed = value;
    }
  }

  get files(): FileList {
    const files = new FileList();

    if (this.#nativeDataTransfer) {
      _.FileList.setNative(files, this.#nativeDataTransfer.files as never);
      return files;
    }

    const out = [];
    for (const item of this.items) {
      const file = item.getAsFile();
      if (file) out.push(file);
    }
    _.FileList.setFiles(files, out);
    return files;
  }

  get items(): DataTransferItemList {
    return this.#items;
  }

  get types(): readonly string[] {
    if (this.#nativeDataTransfer) {
      return [...this.#nativeDataTransfer.types];
    }

    const set = new Set<string>();
    for (const item of this.items) {
      set.add(item.type);
      if (item.kind === "file") {
        set.add("Files");
      }
    }
    return [...set];
  }

  clearData(format?: string): void {
    if (this.#nativeDataTransfer) {
      this.#nativeDataTransfer.clearData(format);
      return;
    }

    if (format == null) {
      const next = [];
      for (const item of this.items) {
        if (item.kind === "file") next.push(item);
      }
      _.DataTransferItemList.setItems(this.#items, next);
      return;
    }

    const needle = normalizeFormat(format);
    const next = [];
    for (const item of this.items) {
      if (!(item.kind === "string" && normalizeFormat(item.type) === needle)) {
        next.push(item);
      }
    }
    _.DataTransferItemList.setItems(this.#items, next);
  }

  getData(format: string): string {
    if (this.#nativeDataTransfer) {
      return this.#nativeDataTransfer.getData(format);
    }

    const needle = normalizeFormat(format);
    for (const item of this.items) {
      if (item.kind === "string" && normalizeFormat(item.type) === needle) {
        return _.DataTransferItem.getStringValue(item) ?? "";
      }
    }
    return "";
  }

  setData(format: string, data: string): void {
    format = normalizeFormat(format);

    if (this.#nativeDataTransfer) {
      this.#nativeDataTransfer.setData(format, String(data));
      return;
    }

    this.clearData(format);
    this.items.add(String(data), format);
  }

  setDragImage(image: Element, x: number, y: number): void {
    if (this.#nativeDataTransfer) {
      this.#nativeDataTransfer.setDragImage(image, x, y);
      return;
    }

    void image;
    void x;
    void y;
  }

  get [Symbol.toStringTag](): "DataTransfer" {
    return "DataTransfer";
  }

  static {
    _.DataTransfer = {
      new: () => new DataTransfer(),
      getNative: (dataTransfer) => dataTransfer.#nativeDataTransfer,
      setNative: (
        dataTransfer,
        native,
      ) => (dataTransfer.#nativeDataTransfer = native, dataTransfer),
      getItems: (dataTransfer) => dataTransfer.#items,
      setItems: (
        dataTransfer,
        items,
      ) => (dataTransfer.#items = items, dataTransfer),
      getDropEffect: (dataTransfer) => dataTransfer.#dropEffect,
      setDropEffect: (
        dataTransfer,
        value,
      ) => (dataTransfer.#dropEffect = value, dataTransfer),
      getEffectAllowed: (dataTransfer) => dataTransfer.#effectAllowed,
      setEffectAllowed: (
        dataTransfer,
        value,
      ) => (dataTransfer.#effectAllowed = value, dataTransfer),
    };
  }
}
