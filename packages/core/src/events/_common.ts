import {
  $globalThis,
  _,
  ArrayPrototypeIncludes,
  ArrayPrototypeIndexOf,
  ArrayPrototypePush,
  ArrayPrototypeSlice,
  ArrayPrototypeSplice,
  FunctionPrototypeCall,
  ObjectCreate,
  Symbol,
} from "dawm-internal";
import type { Event } from "./Event.ts";
import type { EventTarget } from "./EventTarget.ts";

export interface EventTargetData {
  assignedSlot: boolean;
  hasActivationBehavior: boolean;
  host: EventTarget | null;
  listeners: Record<string, EventListenerRecord[]>;
  mode: "" | "open" | "closed";
}

export interface EventListenerRecord {
  callback: EventListenerOrEventListenerObject;
  options: AddEventListenerOptionsNormalized;
}

export interface EventPathEntry {
  item: EventTarget;
  itemInShadowTree: boolean;
  relatedTarget: EventTarget | null;
  rootOfClosedTree: boolean;
  slotInClosedTree: boolean;
  target: EventTarget | null;
  touchTargetList: EventTarget[];
}

export interface AddEventListenerOptionsNormalized {
  capture: boolean;
  once: boolean;
  passive: boolean;
  signal?: AbortSignal;
  [kResistStopImmediatePropagation]?: boolean;
}

export type ListenerMap = Record<string, EventListenerRecord[]>;

export interface EventTargetWithData extends EventTarget {
  [eventTargetData]: EventTargetData;
}

/** Internal symbol for non-spec EventTarget metadata. */
export const eventTargetData: unique symbol = Symbol(
  "[[eventTargetData]]",
) as never;

/**
 * Internal marker allowing specific listeners to ignore
 * `event.stopImmediatePropagation()`.
 */
export const kResistStopImmediatePropagation: unique symbol = Symbol(
  "kResistStopImmediatePropagation",
) as never;

export function getDefaultTargetData(): EventTargetData {
  return {
    assignedSlot: false,
    hasActivationBehavior: false,
    host: null,
    listeners: ObjectCreate(null),
    mode: "",
  };
}

export function setEventTargetData(target: EventTarget): EventTarget {
  (target as {} as EventTargetWithData)[eventTargetData] =
    getDefaultTargetData();
  return target;
}

export function getAssignedSlot(
  target: EventTarget | null | undefined,
): boolean {
  return Boolean(
    (target as {} as EventTargetWithData)?.[eventTargetData]?.assignedSlot,
  );
}

export function getHasActivationBehavior(
  target: EventTarget | null | undefined,
): boolean {
  return Boolean(
    (target as {} as EventTargetWithData)?.[eventTargetData]
      ?.hasActivationBehavior,
  );
}

export function getHost(
  target: EventTarget | null | undefined,
): EventTarget | null {
  return (target as {} as EventTargetWithData)?.[eventTargetData]?.host ?? null;
}

export function getListeners(
  target: EventTarget | null | undefined,
): ListenerMap {
  return (target as {} as EventTargetWithData)?.[eventTargetData]?.listeners ??
    ObjectCreate(null);
}

export function getMode(
  target: EventTarget | null | undefined,
): "" | "open" | "closed" {
  return (target as {} as EventTargetWithData)?.[eventTargetData]?.mode ?? "";
}

export function listenerCount(target: EventTarget, type: string): number {
  return getListeners(target)[type]?.length ?? 0;
}

// https://dom.spec.whatwg.org/#concept-shadow-including-inclusive-ancestor
export function isShadowInclusiveAncestor(
  ancestor: EventTarget | null,
  node: EventTarget | null,
): boolean {
  let current = node;
  while (_.isNode(current)) {
    if (current === ancestor) return true;
    if (isShadowRoot(current)) {
      current = getHost(current);
    } else {
      current = current.parentNode as EventTarget | null;
    }
  }

  return false;
}

export function isShadowRoot(
  nodeImpl: unknown,
): nodeImpl is EventTarget & { nodeType: 11; host: EventTarget } {
  return _.isNode(nodeImpl) &&
    nodeImpl.nodeType === 11 &&
    getHost(nodeImpl as unknown as EventTarget) != null;
}

export function isSlottable(_nodeImpl: EventTarget): boolean {
  // TODO: support slottables once Shadow DOM is implemented.
  return false;
}

export function getParent(
  eventTarget: EventTarget,
  event: Event,
): EventTarget | null {
  if (_.isNode(eventTarget)) {
    return eventTarget.parentNode as EventTarget | null;
  }

  return eventTarget.getParent?.(event) ?? null;
}

export function getRoot(eventTarget: EventTarget): EventTarget | null {
  if (!_.isNode(eventTarget)) return null;

  return eventTarget.getRootNode({ composed: true });
}

export function getRelatedTarget(event: Event): EventTarget | null {
  const relatedTarget =
    (event as Event & { relatedTarget?: EventTarget | null }).relatedTarget;
  return relatedTarget ?? null;
}

export function appendToEventPath(
  event: Event,
  target: EventTarget,
  targetOverride: EventTarget | null,
  relatedTarget: EventTarget | null,
  touchTargets: EventTarget[],
  slotInClosedTree: boolean,
): void {
  const itemInShadowTree = _.isNode(target) && isShadowRoot(getRoot(target));
  const rootOfClosedTree = isShadowRoot(target) && getMode(target) === "closed";
  const path = _.Event.getPath(event) as EventPathEntry[];

  ArrayPrototypePush(path, {
    item: target,
    itemInShadowTree,
    target: targetOverride,
    relatedTarget,
    touchTargetList: touchTargets,
    rootOfClosedTree,
    slotInClosedTree,
  });
}

export function retarget(
  a: EventTarget | null,
  b: EventTarget,
): EventTarget | null {
  while (true) {
    if (!_.isNode(a)) {
      return a;
    }

    const aRoot = a.getRootNode();
    if (
      !isShadowRoot(aRoot) ||
      (_.isNode(b) && isShadowInclusiveAncestor(aRoot, b))
    ) {
      return a;
    }

    a = getHost(aRoot);
  }
}

export function reportException(error: unknown): void {
  if ("reportError" in $globalThis && _.isFunction($globalThis.reportError)) {
    return void $globalThis.reportError(error);
  }

  queueMicrotask(() => {
    throw error;
  });
}

export function innerInvokeEventListeners(
  eventImpl: Event,
  targetListeners: ListenerMap,
): boolean {
  const { type } = eventImpl;

  if (!targetListeners || !targetListeners[type]) {
    return false;
  }

  let found = false;
  const listenerList = targetListeners[type];
  const handlersLength = listenerList.length;

  let handlers = listenerList;
  if (handlersLength > 1) {
    handlers = ArrayPrototypeSlice(listenerList);
  }

  for (let i = 0; i < handlersLength; i++) {
    const listener = handlers[i];

    if (
      _.Event.getStopImmediatePropagationFlag(eventImpl) &&
      !listener.options[kResistStopImmediatePropagation]
    ) {
      continue;
    }

    const { capture, once, passive } = listener.options;

    // The listener may have been removed while iterating a cloned list.
    if (!ArrayPrototypeIncludes(listenerList, listener)) {
      continue;
    }

    found = true;

    if (
      (eventImpl.eventPhase === 1 /* Event.CAPTURING_PHASE */ && !capture) ||
      (eventImpl.eventPhase === 3 /* Event.BUBBLING_PHASE */ && capture)
    ) continue;

    if (once) {
      const idx = ArrayPrototypeIndexOf(listenerList, listener);
      if (idx !== -1) ArrayPrototypeSplice(listenerList, idx, 1);
    }

    if (passive) _.Event.setInPassiveListener(eventImpl, true);

    try {
      if (typeof listener.callback === "object") {
        listener.callback?.handleEvent?.(eventImpl);
      } else {
        FunctionPrototypeCall(
          listener.callback,
          eventImpl.currentTarget,
          eventImpl,
        );
      }
    } catch (error) {
      reportException(error);
    }

    _.Event.setInPassiveListener(eventImpl, false);
  }

  return found;
}

export function invokeEventListeners(
  tuple: EventPathEntry,
  eventImpl: Event,
): void {
  const path = _.Event.getPath(eventImpl) as EventPathEntry[];

  if (path.length === 1) {
    const t = path[0];
    if (t.target) _.Event.setTarget(eventImpl, t.target);
  } else {
    const tupleIndex = ArrayPrototypeIndexOf(path, tuple);
    for (let i = tupleIndex; i >= 0; i--) {
      const t = path[i];
      if (t.target) {
        _.Event.setTarget(eventImpl, t.target);
        break;
      }
    }
  }

  if (_.Event.getStopPropagationFlag(eventImpl)) return;
  _.Event.setCurrentTarget(eventImpl, tuple.item);

  try {
    innerInvokeEventListeners(eventImpl, getListeners(tuple.item));
  } catch (error) {
    reportException(error);
  }
}

export function normalizeEventHandlerOptions(
  options?: boolean | EventListenerOptions,
): EventListenerOptions {
  if (typeof options === "boolean" || typeof options === "undefined") {
    return {
      capture: Boolean(options),
    };
  }

  return {
    capture: Boolean(options.capture),
  };
}

export function addEventListenerOptionsConverter(
  options?: boolean | AddEventListenerOptions,
): AddEventListenerOptionsNormalized {
  if (typeof options !== "object" || options === null) {
    return {
      capture: Boolean(options),
      once: false,
      passive: false,
    };
  }

  const normalized: AddEventListenerOptionsNormalized = {
    capture: Boolean(options.capture),
    once: Boolean(options.once),
    passive: Boolean(options.passive),
    [kResistStopImmediatePropagation]: Boolean(
      (options as any)[kResistStopImmediatePropagation],
    ),
  };

  if (options.signal !== undefined && options.signal !== null) {
    normalized.signal = options.signal;
  }

  return normalized;
}

/**
 * Dispatches an event following the DOM event path algorithm.
 */
export function dispatch(
  targetImpl: EventTarget,
  eventImpl: Event,
  targetOverride?: EventTarget,
): boolean {
  let clearTargets = false;
  let activationTarget: EventTarget | null = null;

  _.Event.setDispatched(eventImpl, true);

  targetOverride ??= targetImpl;
  const eventRelatedTarget = getRelatedTarget(eventImpl);
  let relatedTarget = retarget(eventRelatedTarget, targetImpl);

  if (targetImpl !== relatedTarget || targetImpl === eventRelatedTarget) {
    const touchTargets: EventTarget[] = [];

    appendToEventPath(
      eventImpl,
      targetImpl,
      targetOverride,
      relatedTarget,
      touchTargets,
      false,
    );

    const isActivationEvent = eventImpl.type === "click";

    if (isActivationEvent && getHasActivationBehavior(targetImpl)) {
      activationTarget = targetImpl;
    }

    let slotInClosedTree = false;
    let slottable = isSlottable(targetImpl) && getAssignedSlot(targetImpl)
      ? targetImpl
      : null;
    let parent = getParent(targetImpl, eventImpl);

    while (parent !== null) {
      if (slottable !== null) {
        slottable = null;

        const parentRoot = getRoot(parent);
        if (
          isShadowRoot(parentRoot) &&
          getMode(parentRoot) === "closed"
        ) {
          slotInClosedTree = true;
        }
      }

      relatedTarget = retarget(eventRelatedTarget, parent);

      if (
        _.isNode(parent) &&
        isShadowInclusiveAncestor(getRoot(targetImpl), parent)
      ) {
        appendToEventPath(
          eventImpl,
          parent,
          null,
          relatedTarget,
          touchTargets,
          slotInClosedTree,
        );
      } else if (parent === relatedTarget) {
        parent = null;
      } else {
        targetImpl = parent;

        if (
          isActivationEvent &&
          activationTarget === null &&
          getHasActivationBehavior(targetImpl)
        ) {
          activationTarget = targetImpl;
        }

        appendToEventPath(
          eventImpl,
          parent,
          targetImpl,
          relatedTarget,
          touchTargets,
          slotInClosedTree,
        );
      }

      if (parent !== null) parent = getParent(parent, eventImpl);

      slotInClosedTree = false;
    }

    const path = _.Event.getPath(eventImpl) as EventPathEntry[];
    let clearTargetsTuple: EventPathEntry | null = null;

    for (let i = path.length - 1; i >= 0; i--) {
      if (path[i].target !== null) {
        clearTargetsTuple = path[i];
        break;
      }
    }

    if (clearTargetsTuple) {
      clearTargets = (_.isNode(clearTargetsTuple.target) &&
        isShadowRoot(getRoot(clearTargetsTuple.target))) ||
        (_.isNode(clearTargetsTuple.relatedTarget) &&
          isShadowRoot(getRoot(clearTargetsTuple.relatedTarget)));
    }

    _.Event.setEventPhase(eventImpl, 1 /* Event.CAPTURING_PHASE */);

    for (let i = path.length - 1; i >= 0; --i) {
      const tuple = path[i];
      if (tuple.target === null) {
        invokeEventListeners(tuple, eventImpl);
      }
    }

    for (let i = 0; i < path.length; i++) {
      const tuple = path[i];

      if (tuple.target !== null) {
        _.Event.setEventPhase(eventImpl, 2 /* Event.AT_TARGET */);
      } else {
        _.Event.setEventPhase(eventImpl, 3 /* Event.BUBBLING_PHASE */);
      }

      if (
        (eventImpl.eventPhase === 3 /* Event.BUBBLING_PHASE */ &&
          eventImpl.bubbles) ||
        eventImpl.eventPhase === 2 /* Event.AT_TARGET */
      ) {
        invokeEventListeners(tuple, eventImpl);
      }
    }
  }

  _.Event.setEventPhase(eventImpl, 0 /* Event.NONE */);
  _.Event.setCurrentTarget(eventImpl, null);
  _.Event.setPath(eventImpl, []);
  _.Event.setDispatched(eventImpl, false);
  eventImpl.cancelBubble = false;
  _.Event.setStopImmediatePropagationFlag(eventImpl, false);

  if (clearTargets) {
    _.Event.setTarget(eventImpl, null);
  }

  // NOTE: activation behavior hooks are not implemented in dawm yet.
  void activationTarget;

  return !eventImpl.defaultPrevented;
}
