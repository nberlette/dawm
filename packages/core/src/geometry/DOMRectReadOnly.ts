import { _, SymbolToStringTag, toStringTag } from "dawm-internal";

declare module "dawm-internal" {
  export interface DOMRectInternals {
    setX<T extends DOMRectReadOnly>(rect: T, x: number): T;
    setY<T extends DOMRectReadOnly>(rect: T, y: number): T;
    setWidth<T extends DOMRectReadOnly>(rect: T, width: number): T;
    setHeight<T extends DOMRectReadOnly>(rect: T, height: number): T;
  }

  export interface internal {
    DOMRect: DOMRectInternals;
  }
}

export interface DOMRectInit {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export class DOMRectReadOnly {
  static fromRect(rect: DOMRectInit): DOMRectReadOnly {
    _.webidl.assertBranded(this, DOMRectReadOnly);
    return new this(rect.x, rect.y, rect.width, rect.height);
  }

  #x = 0;
  #y = 0;
  #width = 0;
  #height = 0;

  constructor(x?: number, y?: number, width?: number, height?: number) {
    this.#x = +(x ?? 0) || 0;
    this.#y = +(y ?? 0) || 0;
    this.#width = +(width ?? 0) || 0;
    this.#height = +(height ?? 0) || 0;

    _.webidl.createBranded(this);
  }

  get x(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    return this.#x;
  }

  get y(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    return this.#y;
  }

  get width(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    return this.#width;
  }

  get height(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    return this.#height;
  }

  get top(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    const { y, height } = this;
    return height < 0 ? y + height : y;
  }

  get right(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    const { x, width } = this;
    return width < 0 ? x : x + width;
  }

  get bottom(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    const { y, height } = this;
    return height < 0 ? y : y + height;
  }

  get left(): number {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    const { x, width } = this;
    return width < 0 ? x + width : x;
  }

  toJSON(): DOMRectInit {
    _.webidl.assertBranded(this, DOMRectReadOnlyPrototype);
    const { x, y, width, height } = this;
    return { x, y, width, height };
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    _.DOMRect = {
      setX: (it, x) => (it.#x = x, it),
      setY: (it, y) => (it.#y = y, it),
      setWidth: (it, width) => (it.#width = width, it),
      setHeight: (it, height) => (it.#height = height, it),
    };
    _.webidl.createBranded(this);

    toStringTag("DOMRectReadOnly")(this);
  }
}

const DOMRectReadOnlyPrototype = _.webidl.createBranded(
  DOMRectReadOnly.prototype,
);
