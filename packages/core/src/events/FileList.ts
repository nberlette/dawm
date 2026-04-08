import { _ } from "dawm-internal";
import { File, toFile } from "dawm-fetch/file";

interface NativeFileListLike {
  readonly length: number;
  item(index: number): unknown;
  [index: number]: unknown;
}

declare module "dawm-internal" {
  export interface FileListInternal {
    new: (files?: Iterable<File> | ArrayLike<File>) => FileList;
    getNative(list: FileList): NativeFileListLike | null;
    setNative(list: FileList, nativeList: NativeFileListLike | null): FileList;
    getFiles(list: FileList): readonly File[];
    setFiles(list: FileList, files: readonly File[]): FileList;
  }

  export interface internal {
    FileList: FileListInternal;
  }
}

function looksNativeFileList(value: unknown): value is NativeFileListLike {
  return !!value && typeof value === "object" &&
    typeof (value as { length?: unknown }).length === "number" &&
    typeof (value as { item?: unknown }).item === "function";
}

function toFileArray(
  value: Iterable<File> | ArrayLike<File> | null | undefined,
): File[] {
  if (!value) {
    return [];
  }

  if (typeof (value as Iterable<File>)[Symbol.iterator] === "function") {
    const out: File[] = [];
    for (const item of value as Iterable<File>) {
      const file = toFile(item);
      if (file) out.push(file);
    }
    return out;
  }

  const arrayLike = value as ArrayLike<File>;
  const out: File[] = [];
  for (let i = 0; i < arrayLike.length; i++) {
    const file = toFile(arrayLike[i]);
    if (file) out.push(file);
  }
  return out;
}

/**
 * Runtime-agnostic FileList implementation.
 */
export class FileList {
  #nativeList: NativeFileListLike | null = null;
  #files: readonly File[] = [];

  [index: number]: File;

  constructor(files: Iterable<File> | ArrayLike<File> = []) {
    if (looksNativeFileList(files)) {
      this.#nativeList = files;
      return;
    }

    this.#files = toFileArray(files);
    this.#syncIndexProperties();
  }

  get length(): number {
    return this.#nativeList?.length ?? this.#files.length;
  }

  item(index: number): File | null {
    index = Number(index);
    if (!Number.isFinite(index)) {
      return null;
    }

    const normalized = Math.trunc(index);
    if (normalized < 0) {
      return null;
    }

    if (this.#nativeList) {
      return toFile(this.#nativeList.item(normalized));
    }

    return this.#files[normalized] ?? null;
  }

  [Symbol.iterator](): IterableIterator<File> {
    let i = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next: (): IteratorResult<File> => {
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

    for (let i = 0; i < this.#files.length; i++) {
      Object.defineProperty(this, String(i), {
        configurable: true,
        enumerable: true,
        writable: false,
        value: this.#files[i],
      });
    }
  }

  get [Symbol.toStringTag](): "FileList" {
    return "FileList";
  }

  static {
    _.FileList = {
      new: (files) => new FileList(files),
      getNative: (list) => list.#nativeList,
      setNative: (list, nativeList) => (list.#nativeList = nativeList, list),
      getFiles: (list) => [...list.#files],
      setFiles: (list, files) => {
        list.#files = [...files];
        list.#nativeList = null;
        list.#syncIndexProperties();
        return list;
      },
    };
  }
}
