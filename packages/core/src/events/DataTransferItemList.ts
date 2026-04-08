import { _ } from "dawm-internal";
import { DOMException } from "dawm-core/dom-exception";
import { File, toFile } from "dawm-fetch/file";
import { DataTransferItem } from "./DataTransferItem.ts";

interface NativeDataTransferItemListLike {
  readonly length: number;
  add(data: string, type: string): unknown;
  add(data: unknown): unknown;
  clear(): void;
  item(index: number): unknown;
  remove(index: number): void;
  [index: number]: unknown;
}

declare module "dawm-internal" {
  export interface DataTransferItemListInternal {
    new: (
      items?: Iterable<DataTransferItem> | ArrayLike<DataTransferItem>,
    ) => DataTransferItemList;
    getNative(
      list: DataTransferItemList,
    ): NativeDataTransferItemListLike | null;
    setNative(
      list: DataTransferItemList,
      nativeList: NativeDataTransferItemListLike | null,
    ): DataTransferItemList;
    getItems(list: DataTransferItemList): readonly DataTransferItem[];
    setItems(
      list: DataTransferItemList,
      items: readonly DataTransferItem[],
    ): DataTransferItemList;
  }

  export interface internal {
    DataTransferItemList: DataTransferItemListInternal;
  }
}

function looksNativeList(
  value: unknown,
): value is NativeDataTransferItemListLike {
  return !!value && typeof value === "object" &&
    typeof (value as { length?: unknown }).length === "number" &&
    typeof (value as { item?: unknown }).item === "function" &&
    typeof (value as { remove?: unknown }).remove === "function";
}

function toItemArray(
  items:
    | Iterable<DataTransferItem>
    | ArrayLike<DataTransferItem>
    | null
    | undefined,
): DataTransferItem[] {
  if (!items) {
    return [];
  }

  if (
    typeof (items as Iterable<DataTransferItem>)[Symbol.iterator] === "function"
  ) {
    return [...(items as Iterable<DataTransferItem>)];
  }

  const out: DataTransferItem[] = [];
  const arrayLike = items as ArrayLike<DataTransferItem>;
  for (let i = 0; i < arrayLike.length; i++) {
    out.push(arrayLike[i]);
  }
  return out;
}

/**
 * Runtime-agnostic DataTransferItemList implementation.
 */
export class DataTransferItemList {
  #nativeList: NativeDataTransferItemListLike | null = null;
  #items: DataTransferItem[] = [];

  [index: number]: DataTransferItem;

  constructor(
    items: Iterable<DataTransferItem> | ArrayLike<DataTransferItem> = [],
  ) {
    if (looksNativeList(items)) {
      this.#nativeList = items;
      return;
    }

    this.#items = toItemArray(items);
    this.#syncIndexProperties();
  }

  get length(): number {
    return this.#nativeList?.length ?? this.#items.length;
  }

  add(data: string, type: string): DataTransferItem | null;
  add(data: File): DataTransferItem | null;
  add(data: string | File, type = "text/plain"): DataTransferItem | null {
    if (this.#nativeList) {
      const nativeItem = typeof data === "string"
        ? this.#nativeList.add(data, type)
        : this.#nativeList.add(data);
      return nativeItem
        ? _.DataTransferItem.fromNative(nativeItem as never)
        : null;
    }

    const item = typeof data === "string"
      ? _.DataTransferItem.newString(type, data)
      : _.DataTransferItem.newFile(toFile(data) ?? new File([], ""));

    this.#items.push(item);
    this.#syncIndexProperties();
    return item;
  }

  clear(): void {
    if (this.#nativeList) {
      this.#nativeList.clear();
      return;
    }

    this.#items = [];
    this.#syncIndexProperties();
  }

  item(index: number): DataTransferItem | null {
    index = Number(index);
    if (!Number.isFinite(index)) return null;

    const normalized = Math.trunc(index);
    if (normalized < 0) return null;

    if (this.#nativeList) {
      const nativeItem = this.#nativeList.item(normalized);
      return nativeItem
        ? _.DataTransferItem.fromNative(nativeItem as never)
        : null;
    }

    return this.#items[normalized] ?? null;
  }

  remove(index: number): void {
    index = Number(index);
    if (!Number.isFinite(index)) {
      throw new DOMException("The index is invalid", "IndexSizeError");
    }

    const normalized = Math.trunc(index);
    if (normalized < 0 || normalized >= this.length) {
      throw new DOMException("The index is invalid", "IndexSizeError");
    }

    if (this.#nativeList) {
      this.#nativeList.remove(normalized);
      return;
    }

    this.#items.splice(normalized, 1);
    this.#syncIndexProperties();
  }

  [Symbol.iterator](): IterableIterator<DataTransferItem> {
    let i = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: (): IteratorResult<DataTransferItem> => {
        const value = this.item(i++);
        if (value == null) {
          return { done: true, value: undefined as never };
        }
        return { done: false, value };
      },
    };
  }

  #syncIndexProperties(): void {
    const keys = Reflect.ownKeys(this);
    for (const key of keys) {
      if (typeof key === "string" && /^\d+$/.test(key)) {
        Reflect.deleteProperty(this, key);
      }
    }

    for (let i = 0; i < this.#items.length; i++) {
      Object.defineProperty(this, String(i), {
        configurable: true,
        enumerable: true,
        writable: false,
        value: this.#items[i],
      });
    }
  }

  get [Symbol.toStringTag](): "DataTransferItemList" {
    return "DataTransferItemList";
  }

  static {
    _.DataTransferItemList = {
      new: (items) => new DataTransferItemList(items),
      getNative: (list) => list.#nativeList,
      setNative: (
        list,
        nativeList,
      ) => (list.#nativeList = nativeList, list),
      getItems: (list) => [...list.#items],
      setItems: (list, items) => {
        list.#items = [...items];
        list.#nativeList = null;
        list.#syncIndexProperties();
        return list;
      },
    };
  }
}
