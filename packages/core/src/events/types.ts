import type { Event } from "./Event.ts";
import type { EventTarget } from "./EventTarget.ts";

export interface EventListenerOptions {
  capture?: boolean | undefined;
}

export interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean | undefined;
  passive?: boolean | undefined;
  signal?: AbortSignal | undefined;
}

export interface EventListenerObject<
  TEvent extends Event = Event,
  This = EventTarget,
> {
  handleEvent(this: This, evt: TEvent): void;
}

export interface EventListener<
  TEvent extends Event = Event,
  This = EventTarget,
> {
  (this: This, evt: TEvent): void;
}

export type EventListenerOrEventListenerObject<
  TEvent extends Event = Event,
  This = EventTarget,
> = EventListener<TEvent, This> | EventListenerObject<TEvent, This>;
