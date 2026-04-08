import { _, SymbolToStringTag, toStringTag, TypeError } from "dawm-internal";
import type { strings } from "dawm-internal/types";
import {
  axisAngleMatrix,
  cloneValues,
  createDOMMatrix,
  createDOMPoint,
  IDENTITY_VALUES,
  invertValues,
  is2DValues,
  isIdentityValues,
  multiplyValues,
  resolveValues,
  rotationXMatrix,
  rotationYMatrix,
  rotationZMatrix,
  scaleMatrix,
  skewXMatrix,
  skewYMatrix,
  toNumber,
  translationMatrix,
} from "./_helpers.ts";
import type { DOMMatrix } from "./DOMMatrix.ts";
import type { DOMPoint } from "./DOMPoint.ts";
import type { DOMPointInit } from "./DOMPointReadOnly.ts";
import "./DOMPointReadOnly.ts";

declare module "dawm-internal" {
  export interface DOMMatrixInternals {
    getValues<T extends DOMMatrixReadOnly>(matrix: T): number[];
    setValue<T extends DOMMatrixReadOnly>(
      matrix: T,
      index: number,
      value: number,
    ): T;
    setValues<T extends DOMMatrixReadOnly>(matrix: T, values: number[]): T;
    createReadOnly(values: number[]): DOMMatrixReadOnly;
    create(values: number[]): DOMMatrix;
  }

  export interface internal {
    DOMMatrix: DOMMatrixInternals;
  }
}

export interface DOMMatrix2DInit {
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  e?: number;
  f?: number;
  is2D?: boolean;
  isIdentity?: boolean;
}

export interface DOMMatrixInit extends DOMMatrix2DInit {
  m11?: number;
  m12?: number;
  m13?: number;
  m14?: number;
  m21?: number;
  m22?: number;
  m23?: number;
  m24?: number;
  m31?: number;
  m32?: number;
  m33?: number;
  m34?: number;
  m41?: number;
  m42?: number;
  m43?: number;
  m44?: number;
}

export class DOMMatrixReadOnly {
  static fromMatrix(init: DOMMatrixInit = {}): DOMMatrixReadOnly {
    _.webidl.assertConstructorContext(this, DOMMatrixReadOnly);
    return new this(init);
  }

  static fromFloat32Array(array: Float32Array): DOMMatrixReadOnly {
    _.webidl.assertConstructorContext(this, DOMMatrixReadOnly);
    if (!(array instanceof Float32Array)) {
      throw new TypeError("Expected Float32Array");
    }
    return new this(array);
  }

  static fromFloat64Array(array: Float64Array): DOMMatrixReadOnly {
    _.webidl.assertConstructorContext(this, DOMMatrixReadOnly);
    if (!(array instanceof Float64Array)) {
      throw new TypeError("Expected Float64Array");
    }
    return new this(array);
  }

  #values: number[] = cloneValues(IDENTITY_VALUES);

  constructor(init?: DOMMatrixInit | ArrayLike<number> | null) {
    this.#values = resolveValues(init);

    _.webidl.createBranded(this);
  }

  get is2D(): boolean {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return is2DValues(this.#values);
  }

  get isIdentity(): boolean {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return isIdentityValues(this.#values);
  }

  get a(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[0];
  }

  get b(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[1];
  }

  get c(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[4];
  }

  get d(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[5];
  }

  get e(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[12];
  }

  get f(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[13];
  }

  get m11(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[0];
  }

  get m12(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[1];
  }

  get m13(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[2];
  }

  get m14(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[3];
  }

  get m21(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[4];
  }

  get m22(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[5];
  }

  get m23(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[6];
  }

  get m24(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[7];
  }

  get m31(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[8];
  }

  get m32(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[9];
  }

  get m33(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[10];
  }

  get m34(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[11];
  }

  get m41(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[12];
  }

  get m42(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[13];
  }

  get m43(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[14];
  }

  get m44(): number {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.#values[15];
  }

  multiply(other: DOMMatrixInit = {}): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const otherValues = resolveValues(other);
    return createDOMMatrix(multiplyValues(this.#values, otherValues));
  }

  translate(tx?: number, ty?: number, tz?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const x = toNumber(tx, 0);
    const y = toNumber(ty, 0);
    const z = toNumber(tz, 0);
    return createDOMMatrix(
      multiplyValues(this.#values, translationMatrix(x, y, z)),
    );
  }

  scale(
    scaleX?: number,
    scaleY?: number,
    scaleZ?: number,
    originX?: number,
    originY?: number,
    originZ?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const sx = toNumber(scaleX, 1);
    const sy = toNumber(scaleY ?? scaleX, 1);
    const sz = toNumber(scaleZ, 1);
    const ox = toNumber(originX, 0);
    const oy = toNumber(originY, 0);
    const oz = toNumber(originZ, 0);

    let values = this.#values;
    if (ox || oy || oz) {
      values = multiplyValues(values, translationMatrix(-ox, -oy, -oz));
    }
    values = multiplyValues(values, scaleMatrix(sx, sy, sz));
    if (ox || oy || oz) {
      values = multiplyValues(values, translationMatrix(ox, oy, oz));
    }
    return createDOMMatrix(values);
  }

  scaleNonUniform(scaleX?: number, scaleY?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const sx = toNumber(scaleX, 1);
    const sy = toNumber(scaleY, 1);
    return this.scale(sx, sy, 1, 0, 0, 0);
  }

  scale3d(
    scale?: number,
    originX?: number,
    originY?: number,
    originZ?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const s = toNumber(scale, 1);
    return this.scale(s, s, s, originX, originY, originZ);
  }

  rotate(rotX?: number, rotY?: number, rotZ?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    let x = toNumber(rotX, 0);
    let y = toNumber(rotY, 0);
    let z = toNumber(rotZ, 0);

    if (rotY === undefined && rotZ === undefined) {
      z = x;
      x = 0;
      y = 0;
    }

    let values = this.#values;
    if (x) values = multiplyValues(values, rotationXMatrix(x));
    if (y) values = multiplyValues(values, rotationYMatrix(y));
    if (z) values = multiplyValues(values, rotationZMatrix(z));
    return createDOMMatrix(values);
  }

  rotateFromVector(x?: number, y?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const vx = toNumber(x, 0);
    const vy = toNumber(y, 0);
    const angle = Math.atan2(vy, vx) * 180 / Math.PI;
    return this.rotate(0, 0, angle);
  }

  rotateAxisAngle(
    x?: number,
    y?: number,
    z?: number,
    angle?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const ax = toNumber(x, 0);
    const ay = toNumber(y, 0);
    const az = toNumber(z, 0);
    const degrees = toNumber(angle, 0);
    const axisMatrix = axisAngleMatrix(ax, ay, az, degrees);
    if (!axisMatrix) return createDOMMatrix(cloneValues(this.#values));
    return createDOMMatrix(multiplyValues(this.#values, axisMatrix));
  }

  skewX(angle?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const degrees = toNumber(angle, 0);
    return createDOMMatrix(multiplyValues(this.#values, skewXMatrix(degrees)));
  }

  skewY(angle?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const degrees = toNumber(angle, 0);
    return createDOMMatrix(multiplyValues(this.#values, skewYMatrix(degrees)));
  }

  flipX(): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.scale(-1, 1, 1, 0, 0, 0);
  }

  flipY(): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return this.scale(1, -1, 1, 0, 0, 0);
  }

  inverse(): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const inverted = invertValues(this.#values);
    if (!inverted) {
      return createDOMMatrix(new Array(16).fill(Number.NaN));
    }
    return createDOMMatrix(inverted);
  }

  transformPoint(point: DOMPointInit = {}): DOMPoint {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    const x = toNumber(point.x, 0);
    const y = toNumber(point.y, 0);
    const z = toNumber(point.z, 0);
    const w = toNumber(point.w, 1);
    const values = this.#values;

    const nx = x * values[0] + y * values[4] + z * values[8] + w * values[12];
    const ny = x * values[1] + y * values[5] + z * values[9] + w * values[13];
    const nz = x * values[2] + y * values[6] + z * values[10] + w * values[14];
    const nw = x * values[3] + y * values[7] + z * values[11] + w * values[15];

    return createDOMPoint(nx, ny, nz, nw);
  }

  toFloat32Array(): Float32Array {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return new Float32Array(this.#values);
  }

  toFloat64Array(): Float64Array {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return new Float64Array(this.#values);
  }

  toJSON(): DOMMatrixInit {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    return {
      a: this.a,
      b: this.b,
      c: this.c,
      d: this.d,
      e: this.e,
      f: this.f,
      m11: this.m11,
      m12: this.m12,
      m13: this.m13,
      m14: this.m14,
      m21: this.m21,
      m22: this.m22,
      m23: this.m23,
      m24: this.m24,
      m31: this.m31,
      m32: this.m32,
      m33: this.m33,
      m34: this.m34,
      m41: this.m41,
      m42: this.m42,
      m43: this.m43,
      m44: this.m44,
      is2D: this.is2D,
      isIdentity: this.isIdentity,
    };
  }

  toString(): string {
    _.webidl.assertBranded(this, DOMMatrixReadOnlyPrototype);
    if (this.is2D) {
      return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
    }
    const values = this.#values;
    return `matrix3d(${values[0]}, ${values[1]}, ${values[2]}, ${values[3]}, ${
      values[4]
    }, ${values[5]}, ${values[6]}, ${values[7]}, ${values[8]}, ${values[9]}, ${
      values[10]
    }, ${values[11]}, ${values[12]}, ${values[13]}, ${values[14]}, ${
      values[15]
    })`;
  }

  declare readonly [SymbolToStringTag]: "DOMMatrixReadOnly" | strings;

  static {
    _.DOMMatrix = {
      getValues: (it) => it.#values.slice(),
      setValue: (it, index, value) => (it.#values[index] = value, it),
      setValues: (it, values) => (it.#values = values.slice(), it),
      createReadOnly: (values) => new DOMMatrixReadOnly(values),
      create: (values) => {
        void values;
        throw new TypeError("unimplemented");
      },
    };
    _.webidl.createBranded(this);

    toStringTag("DOMMatrixReadOnly")(this);
  }
}

const DOMMatrixReadOnlyPrototype = _.webidl.createBranded(
  DOMMatrixReadOnly.prototype,
);
