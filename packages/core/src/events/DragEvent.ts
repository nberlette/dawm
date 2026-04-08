import {
  _,
  ObjectDefineProperty,
  ObjectIsPrototypeOf,
  SymbolToStringTag,
} from "dawm-internal";
import { kDenoCustomInspect } from "dawm-internal/symbols";
import type { DataTransfer } from "./DataTransfer.ts";
import { MouseEvent, type MouseEventInit } from "./MouseEvent.ts";

export interface DragEventInit extends MouseEventInit {
  dataTransfer?: DataTransfer | null;
}

declare module "dawm-internal" {
  export interface DragEventInternal {
    new: (type: string, eventInitDict?: DragEventInit) => DragEvent;
    getDataTransfer(event: DragEvent): DataTransfer | null;
    setDataTransfer(
      event: DragEvent,
      dataTransfer: DataTransfer | null,
    ): DragEvent;
  }

  export interface internal {
    DragEvent: DragEventInternal;
  }
}

const DRAG_EVENT_PROPS = [
  "type",
  "target",
  "currentTarget",
  "eventPhase",
  "bubbles",
  "cancelable",
  "composed",
  "timeStamp",
  "detail",
  "view",
  "screenX",
  "screenY",
  "clientX",
  "clientY",
  "x",
  "y",
  "movementX",
  "movementY",
  "ctrlKey",
  "shiftKey",
  "altKey",
  "metaKey",
  "button",
  "buttons",
  "relatedTarget",
  "which",
  "dataTransfer",
] as const;

/**
 * Represents drag-and-drop events.
 *
 * @example
 * ```ts
 * import { DragEvent } from "dawm/events";
 *
 * const event = new DragEvent("dragstart", { bubbles: true });
 * event.type; // "dragstart"
 * ```
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DragEvent
 */
export class DragEvent extends MouseEvent {
  #dataTransfer: DataTransfer | null = null;

  constructor(
    type: string,
    eventInitDict: DragEventInit = { __proto__: null } as DragEventInit,
  ) {
    super(type, eventInitDict);

    // TODO: remove when this interface is fully spec aligned.
    this[SymbolToStringTag] = "DragEvent";

    this.#dataTransfer = eventInitDict.dataTransfer ?? null;
  }

  get dataTransfer(): DataTransfer | null {
    return this.#dataTransfer;
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    ObjectDefineProperty(DragEvent.prototype, kDenoCustomInspect, {
      __proto__: null,
      value(
        inspect: (v: unknown, o: Record<string, unknown>) => string,
        inspectOptions: Record<string, unknown>,
      ): string {
        return inspect(
          _.createFilteredInspectProxy({
            object: this,
            evaluate: ObjectIsPrototypeOf(DragEventPrototype, this),
            keys: [...DRAG_EVENT_PROPS],
          }),
          inspectOptions,
        );
      },
      configurable: true,
    } as PropertyDescriptor);

    _.DragEvent = {
      new: (type, eventInitDict) => new DragEvent(type, eventInitDict),
      getDataTransfer: (event) => event.#dataTransfer,
      setDataTransfer: (
        event,
        dataTransfer,
      ) => (event.#dataTransfer = dataTransfer, event),
    };
  }
}

const DragEventPrototype = _.webidl.createBranded(DragEvent.prototype);
