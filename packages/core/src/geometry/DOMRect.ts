import { _, SymbolToStringTag, toStringTag } from "dawm-internal";
import { type DOMRectInit, DOMRectReadOnly } from "./DOMRectReadOnly.ts";

export type { DOMRectInit };

export class DOMRect extends DOMRectReadOnly {
  static override fromRect(rect: DOMRectInit): DOMRect {
    _.webidl.assertBranded(this, DOMRectReadOnly);

    return new this(rect.x, rect.y, rect.width, rect.height);
  }

  constructor(x?: number, y?: number, width?: number, height?: number) {
    super(x, y, width, height);
  }

  override get x(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.x;
  }

  override set x(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setX(this, value);
  }

  override get y(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.y;
  }

  override set y(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setY(this, value);
  }

  override get width(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.width;
  }

  override set width(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setWidth(this, value);
  }

  override get height(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.height;
  }

  override set height(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setHeight(this, value);
  }

  override get top(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.top;
  }

  override set top(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setY(this, value);
  }

  override get right(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.right;
  }

  override set right(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setWidth(this, value - this.left);
  }

  override get bottom(): number {
    _.webidl.assertBranded(this, DOMRectPrototype);
    return super.bottom;
  }

  override set bottom(value: number) {
    _.webidl.assertBranded(this, DOMRectPrototype);
    _.DOMRect.setHeight(this, value - this.top);
  }

  declare readonly [SymbolToStringTag]: "DOMRect";

  static {
    toStringTag("DOMRect")(this);

    _.webidl.createBranded(this);
  }
}

const DOMRectPrototype = _.webidl.createBranded(DOMRect.prototype);
