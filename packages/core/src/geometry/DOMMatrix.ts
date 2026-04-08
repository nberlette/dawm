import { _, SymbolToStringTag, toStringTag } from "dawm-internal";
import { applyResult, parseMatrixValue } from "./_helpers.ts";
import { type DOMMatrixInit, DOMMatrixReadOnly } from "./DOMMatrixReadOnly.ts";

export type { DOMMatrixInit };

export class DOMMatrix extends DOMMatrixReadOnly {
  static override fromMatrix(init: DOMMatrixInit = {}): DOMMatrix {
    _.webidl.assertConstructorContext(this, DOMMatrix);
    return new this(init);
  }

  static override fromFloat32Array(array: Float32Array): DOMMatrix {
    _.webidl.assertConstructorContext(this, DOMMatrix);
    return new this(array);
  }

  static override fromFloat64Array(array: Float64Array): DOMMatrix {
    _.webidl.assertConstructorContext(this, DOMMatrix);
    return new this(array);
  }

  constructor(init?: DOMMatrixInit | ArrayLike<number> | null) {
    super(init);
  }

  override get is2D(): boolean {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.is2D;
  }

  override get isIdentity(): boolean {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.isIdentity;
  }

  override get a(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.a;
  }

  override set a(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 0, value);
  }

  override get b(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.b;
  }

  override set b(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 1, value);
  }

  override get c(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.c;
  }

  override set c(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 4, value);
  }

  override get d(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.d;
  }

  override set d(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 5, value);
  }

  override get e(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.e;
  }

  override set e(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 12, value);
  }

  override get f(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.f;
  }

  override set f(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 13, value);
  }

  override get m11(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m11;
  }

  override set m11(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 0, value);
  }

  override get m12(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m12;
  }

  override set m12(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 1, value);
  }

  override get m13(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m13;
  }

  override set m13(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 2, value);
  }

  override get m14(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m14;
  }

  override set m14(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 3, value);
  }

  override get m21(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m21;
  }

  override set m21(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 4, value);
  }

  override get m22(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m22;
  }

  override set m22(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 5, value);
  }

  override get m23(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m23;
  }

  override set m23(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 6, value);
  }

  override get m24(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m24;
  }

  override set m24(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 7, value);
  }

  override get m31(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m31;
  }

  override set m31(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 8, value);
  }

  override get m32(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m32;
  }

  override set m32(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 9, value);
  }

  override get m33(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m33;
  }

  override set m33(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 10, value);
  }

  override get m34(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m34;
  }

  override set m34(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 11, value);
  }

  override get m41(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m41;
  }

  override set m41(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 12, value);
  }

  override get m42(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m42;
  }

  override set m42(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 13, value);
  }

  override get m43(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m43;
  }

  override set m43(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 14, value);
  }

  override get m44(): number {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return super.m44;
  }

  override set m44(value: number) {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValue(this, 15, value);
  }

  multiplySelf(other: DOMMatrixInit = {}): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.multiply(other));
  }

  translateSelf(tx?: number, ty?: number, tz?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.translate(tx, ty, tz));
  }

  scaleSelf(
    scaleX?: number,
    scaleY?: number,
    scaleZ?: number,
    originX?: number,
    originY?: number,
    originZ?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(
      this,
      super.scale(scaleX, scaleY, scaleZ, originX, originY, originZ),
    );
  }

  scaleNonUniformSelf(scaleX?: number, scaleY?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.scaleNonUniform(scaleX, scaleY));
  }

  scale3dSelf(
    scale?: number,
    originX?: number,
    originY?: number,
    originZ?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.scale3d(scale, originX, originY, originZ));
  }

  rotateSelf(rotX?: number, rotY?: number, rotZ?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.rotate(rotX, rotY, rotZ));
  }

  rotateFromVectorSelf(x?: number, y?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.rotateFromVector(x, y));
  }

  rotateAxisAngleSelf(
    x?: number,
    y?: number,
    z?: number,
    angle?: number,
  ): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.rotateAxisAngle(x, y, z, angle));
  }

  skewXSelf(angle?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.skewX(angle));
  }

  skewYSelf(angle?: number): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.skewY(angle));
  }

  invertSelf(): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    return applyResult(this, super.inverse());
  }

  setMatrixValue(transformList: string): DOMMatrix {
    _.webidl.assertBranded(this, DOMMatrixPrototype);
    _.DOMMatrix.setValues(this, parseMatrixValue(transformList));
    return this;
  }

  declare readonly [SymbolToStringTag]: "DOMMatrix";

  static {
    toStringTag("DOMMatrix")(this);

    _.DOMMatrix.create = (values) => new DOMMatrix(values);
    _.webidl.createBranded(this);
  }
}

const DOMMatrixPrototype = _.webidl.createBranded(DOMMatrix.prototype);
