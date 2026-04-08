import { _ } from "dawm-internal";
import { Event } from "./Event.ts";
import { EventTarget } from "./EventTarget.ts";
import {
  AddEventListenerOptions,
  EventListenerOrEventListenerObject,
} from "./types.ts";

export class TypedEventTarget<
  TEvents extends Record<string, Event> = Record<string, Event>,
  TOption extends Record<string, Record<string, any>> = Record<
    keyof TEvents,
    EventListenerOptions
  >,
  This = TypedEventTarget<
    TEvents,
    TOption,
    TypedEventTarget<TEvents, TOption, any>
  >,
> extends EventTarget {
  static override readonly name = "EventTarget";
  override addEventListener<K extends string & keyof TEvents>(
    type: K,
    listener: EventListenerOrEventListenerObject<TEvents[K], any> | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as any, options);
  }
}
