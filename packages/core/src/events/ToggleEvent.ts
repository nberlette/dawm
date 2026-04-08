import { _ } from "dawm-internal";
import { Event } from "./Event.ts";
import { EventTarget } from "./EventTarget.ts";
import type { Element } from "dawm-core/element";
import type { Converter } from "dawm-webidl/converters";

declare module "dawm-internal" {
  export interface ToggleEventInternal {
    getOldState(event: ToggleEvent): string;
    setOldState(event: ToggleEvent, oldState: string): ToggleEvent;
    getNewState(event: ToggleEvent): string;
    setNewState(event: ToggleEvent, newState: string): ToggleEvent;
    getSource(event: ToggleEvent): Element | null;
  }

  export interface internal {
    ToggleEvent: ToggleEventInternal;
  }
}

declare module "dawm-webidl/converters" {
  export interface Converters {
    "ToggleEventInit": Converter<ToggleEventInit>;
    "ToggleEventInit?": Converter<ToggleEventInit | null | undefined>;
  }
}

interface ToggleEventInitConverterOptions {
  prefix?: string;
  context?: string;
}

_.webidl.converters.define(
  "ToggleEventInit",
  _.webidl.convert.dictionary([
    {
      key: "oldState",
      converter: _.webidl.converters.DOMString,
      allowedValues: ["open", "closed"],
    },
  ]),
);

export interface ToggleEventInit extends EventInit {
  oldState?: string | undefined;
  newState?: string | undefined;
  source?: Element | null | undefined;
}

/**
 * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/ToggleEvent)
 */
export class ToggleEvent extends Event {
  constructor(type: string, eventInitDict?: ToggleEventInit) {
    super(type, eventInitDict);
    const init = _.webidl.converters["ToggleEventInit?"](
      eventInitDict,
      "Failed to construct 'ToggleEvent'",
      "eventInitDict",
    );
  }
}
