import { _, SymbolToStringTag, toStringTag } from "dawm-internal";
import { toNumber } from "./_helpers.ts";
import { type DOMMatrixInit, DOMMatrixReadOnly } from "./DOMMatrixReadOnly.ts";
import type { DOMPoint } from "./DOMPoint.ts";

declare module "dawm-internal" {
  export interface DOMPointInternals {
    setX<T extends DOMPointReadOnly>(point: T, x: number): T;
    setY<T extends DOMPointReadOnly>(point: T, y: number): T;
    setZ<T extends DOMPointReadOnly>(point: T, z: number): T;
    setW<T extends DOMPointReadOnly>(point: T, w: number): T;
    create(x: number, y: number, z: number, w: number): DOMPoint;
    createReadOnly(
      x: number,
      y: number,
      z: number,
      w: number,
    ): DOMPointReadOnly;
  }

  export interface internal {
    DOMPoint: DOMPointInternals;
  }
}

export interface DOMPointInit {
  x?: number;
  y?: number;
  z?: number;
  w?: number;
}

export class DOMPointReadOnly {
  static fromPoint(point: DOMPointInit = {}): DOMPointReadOnly {
    _.webidl.assertConstructorContext(this, DOMPointReadOnly);
    return new this(point.x, point.y, point.z, point.w);
  }

  #x = 0;
  #y = 0;
  #z = 0;
  #w = 1;

  constructor(x?: number, y?: number, z?: number, w?: number) {
    this.#x = toNumber(x, 0);
    this.#y = toNumber(y, 0);
    this.#z = toNumber(z, 0);
    this.#w = toNumber(w, 1);

    _.webidl.createBranded(this);
  }

  get x(): number {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    return this.#x;
  }

  get y(): number {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    return this.#y;
  }

  get z(): number {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    return this.#z;
  }

  get w(): number {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    return this.#w;
  }

  matrixTransform(matrix?: DOMMatrixInit): DOMPoint {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    const domMatrix = new DOMMatrixReadOnly(matrix ?? {});
    return domMatrix.transformPoint(this);
  }

  toJSON(): DOMPointInit {
    _.webidl.assertBranded(this, DOMPointReadOnlyPrototype);
    const { x, y, z, w } = this;
    return { x, y, z, w };
  }

  declare readonly [SymbolToStringTag]: string;

  static {
    _.DOMPoint = {
      setX: (it, x) => (it.#x = x, it),
      setY: (it, y) => (it.#y = y, it),
      setZ: (it, z) => (it.#z = z, it),
      setW: (it, w) => (it.#w = w, it),
      createReadOnly: (x, y, z, w) => {
        const point = new DOMPointReadOnly();
        _.DOMPoint.setX(point, x);
        _.DOMPoint.setY(point, y);
        _.DOMPoint.setZ(point, z);
        _.DOMPoint.setW(point, w);
        return point;
      },
      create: (..._) => {
        throw new TypeError("unimplemented");
      },
    };
    _.webidl.createBranded(this);

    toStringTag("DOMPointReadOnly")(this);
  }
}

const DOMPointReadOnlyPrototype = _.webidl.createBranded(
  DOMPointReadOnly.prototype,
);
