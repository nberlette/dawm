import {
  _,
  SymbolToStringTag,
  toStringTag,
  Webidl,
  webidl,
} from "dawm-internal";
import { IndexedCollection } from "dawm-internal/collections/indexed-collection";

declare module "dawm-internal" {
  export interface DOMStringListInternal {
    new (items: string[]): DOMStringList;

    getItems(list: DOMStringList): string[];
    setItems(list: DOMStringList, items: string[]): DOMStringList;
    getItem(list: DOMStringList, index: number): string | null;
    setItem(list: DOMStringList, index: number, str: string): DOMStringList;
  }

  export interface internal {
    DOMStringList: DOMStringListInternal;
  }
}

export class DOMStringList extends IndexedCollection<string> {
  constructor(items: string[]) {
    super(items, {});
  }
}
