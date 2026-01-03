// deno-lint-ignore-file ban-types
export function isObject(it: unknown): it is object {
  return typeof it === "object" && it !== null;
}

export function isFunction(it: unknown): it is Function {
  return typeof it === "function";
}

export function isString(it: unknown): it is string {
  return typeof it === "string";
}

export function isNumber(it: unknown): it is number {
  return typeof it === "number";
}

export const INFINITY = 1e310;

export function isFinite(it: unknown): it is number {
  return isNumber(it) && it === it && it !== INFINITY && it !== -INFINITY;
}

export function isInteger(it: unknown): it is number {
  return isNumber(it) && it % 1 === 0;
}

const FunctionPrototype = Function.prototype;
const { bind, call, apply } = FunctionPrototype;

export const uncurryThis: <
  F extends (this: T, ...args: A) => R,
  T = ThisParameterType<F>,
  A extends readonly unknown[] = Parameters<F>,
  R = ReturnType<F>,
>(
  fn: F,
  _thisArg?: T,
) => (self: T, ...args: A) => R = bind.bind(call);

export const FunctionPrototypeCall = uncurryThis(call);
export const FunctionPrototypeApply = uncurryThis(apply);
export const FunctionPrototypeBind = uncurryThis(bind);

export const Object = globalThis.Object;
export const ObjectCreate = Object.create;
export const ObjectAssign = Object.assign;
export const ObjectFreeze = Object.freeze;

export const ObjectKeys = Object.keys;
export const ObjectValues = Object.values;
export const ObjectEntries = Object.entries;
export const ObjectFromEntries = Object.fromEntries;

export const ObjectPrototype = Object.prototype;
export const ObjectPrototypeToString = uncurryThis(ObjectPrototype.toString);
export const ObjectDefineProperty = Object.defineProperty;
export const ObjectDefineProperties = Object.defineProperties;
export const ObjectGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
export const ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
export const ObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;

export const ObjectIsPrototypeOf = uncurryThis(Object.isPrototypeOf);
export const ObjectHasOwnProperty = uncurryThis(Object.hasOwnProperty);
export const ObjectPropertyIsEnumerable = uncurryThis(
  Object.propertyIsEnumerable,
);
export { ObjectHasOwnProperty as ObjectHasOwn };

export const StringPrototype = String.prototype;
export const StringPrototypeSlice = uncurryThis(StringPrototype.slice);
export const StringPrototypeTrim = uncurryThis(StringPrototype.trim);
export const StringPrototypeSplit = uncurryThis(StringPrototype.split);
export const StringPrototypeToLowerCase = uncurryThis(
  StringPrototype.toLowerCase,
);
export const StringPrototypeReplace = uncurryThis(
  StringPrototype.replace,
);
export const StringPrototypeStartsWith = uncurryThis(
  StringPrototype.startsWith,
);

export const Number = globalThis.Number;
export const NumberIsNaN = Number.isNaN || function isNaN(it): it is number {
  return isNumber(it) && it !== it;
};
export const NumberParseInt = Number.parseInt || globalThis.parseInt;
export const NumberParseFloat = Number.parseFloat || globalThis.parseFloat;

export const JSON = globalThis.JSON;
export const JSONParse = JSON.parse;
export const JSONStringify = JSON.stringify;

export const Array = globalThis.Array;
export const ArrayPrototype = Array.prototype;
export const ArrayIsArray = Array.isArray || function (it): it is unknown[] {
  return typeof it === "object" && it !== null &&
    ObjectPrototypeToString(it) === "[object Array]";
};

export function indexOf<T>(
  target: ArrayLike<T>,
  value: T,
  fromIndex?: number,
): number {
  const length = target.length >>> 0;
  let i = fromIndex ? Number(fromIndex) : 0;
  if (i < 0) i = Math.max(length + i, 0);
  for (; i < length; i++) {
    if (target[i] === value) return i;
  }
  return -1;
}

export const pop: <T>(target: ArrayLike<T>) => T | undefined = uncurryThis(
  ArrayPrototype.pop,
);

export const push: <T>(target: ArrayLike<T>, ...items: T[]) => number =
  uncurryThis(ArrayPrototype.push);

export const shift: <T>(target: ArrayLike<T>) => T | undefined = uncurryThis(
  ArrayPrototype.shift,
);

export const slice: <T>(
  target: ArrayLike<T>,
  start?: number,
  end?: number,
) => T[] = uncurryThis(ArrayPrototype.slice);

export const splice: <T>(
  target: ArrayLike<T>,
  start: number,
  deleteCount?: number,
  ...items: T[]
) => T[] = uncurryThis(ArrayPrototype.splice);

export const unshift: <T>(target: ArrayLike<T>, ...items: T[]) => number =
  uncurryThis(ArrayPrototype.unshift);

export function isArray<T>(
  it: unknown,
  type?: (item: unknown, index: number, array: unknown[]) => item is T,
): it is T[] {
  if (!ArrayIsArray(it)) return false;
  if (type) {
    for (let i = 0; i < it.length; i++) {
      if (!type(it[i], i, it)) return false;
    }
  }
  return true;
}

export function isIdentifier(s: string): boolean {
  return /^[$_\p{XIDS}][$_\u200C\u200D\p{XIDC}0-9]*$/u.test(s);
}

export const Symbol = globalThis.Symbol;
export const SymbolToStringTag = Symbol.toStringTag;
export const SymbolIterator = Symbol.iterator;
export const SymbolSpecies = Symbol.species;
export const SymbolFor = Symbol.for;

export const WeakRef = globalThis.WeakRef;
export const FinalizationRegistry = globalThis.FinalizationRegistry;
export const WeakMap = globalThis.WeakMap;
export const WeakSet = globalThis.WeakSet;
export const Map = globalThis.Map;
export const Set = globalThis.Set;

export const Math = globalThis.Math;

export const Reflect = globalThis.Reflect;
export const ReflectApply = Reflect.apply;
export const ReflectConstruct = Reflect.construct;
export const ReflectDefineProperty = Reflect.defineProperty;
export const ReflectDeleteProperty = Reflect.deleteProperty;
export const ReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
export const ReflectGetPrototypeOf = Reflect.getPrototypeOf;
export const ReflectGet = Reflect.get;
export const ReflectHas = Reflect.has;
export const ReflectIsExtensible = Reflect.isExtensible;
export const ReflectOwnKeys = Reflect.ownKeys;
export const ReflectPreventExtensions = Reflect.preventExtensions;
export const ReflectSet = Reflect.set;
export const ReflectSetPrototypeOf = Reflect.setPrototypeOf;

export const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
export const INTERNED_STRINGS = Symbol.for("dawm.strings");
