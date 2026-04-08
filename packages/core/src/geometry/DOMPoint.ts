import { _, SymbolToStringTag, toStringTag } from "dawm-internal";
import { type DOMPointInit, DOMPointReadOnly } from "./DOMPointReadOnly.ts";

export type { DOMPointInit };

export class DOMPoint extends DOMPointReadOnly {
  static override fromPoint(point: DOMPointInit = {}): DOMPoint {
    _.webidl.assertConstructorContext(this, DOMPoint);
    return new this(point.x, point.y, point.z, point.w);
  }

  constructor(x?: number, y?: number, z?: number, w?: number) {
    super(x, y, z, w);
  }

  override get x(): number {
    _.webidl.assertBranded(this, DOMPointPrototype);
    return super.x;
  }

  override set x(value: number) {
    _.webidl.assertBranded(this, DOMPointPrototype);
    _.DOMPoint.setX(this, value);
  }

  override get y(): number {
    _.webidl.assertBranded(this, DOMPointPrototype);
    return super.y;
  }

  override set y(value: number) {
    _.webidl.assertBranded(this, DOMPointPrototype);
    _.DOMPoint.setY(this, value);
  }

  override get z(): number {
    _.webidl.assertBranded(this, DOMPointPrototype);
    return super.z;
  }

  override set z(value: number) {
    _.webidl.assertBranded(this, DOMPointPrototype);
    _.DOMPoint.setZ(this, value);
  }

  override get w(): number {
    _.webidl.assertBranded(this, DOMPointPrototype);
    return super.w;
  }

  override set w(value: number) {
    _.webidl.assertBranded(this, DOMPointPrototype);
    _.DOMPoint.setW(this, value);
  }

  declare readonly [SymbolToStringTag]: "DOMPoint";

  static {
    toStringTag("DOMPoint")(this);

    _.DOMPoint.create = (x, y, z, w) => new DOMPoint(x, y, z, w);
    _.webidl.createBranded(this);
  }
}

const DOMPointPrototype = _.webidl.createBranded(DOMPoint.prototype);
