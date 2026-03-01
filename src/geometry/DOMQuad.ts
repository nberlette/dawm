import { internal as _ } from "../internal/api.ts";
import { SymbolToStringTag } from "../internal/primordials.ts";
import { toStringTag } from "../internal/to_string_tag.decorator.ts";
import { defaultPoint, toNumber } from "./_helpers.ts";
import { DOMPoint, type DOMPointInit } from "./DOMPoint.ts";
import { DOMRect } from "./DOMRect.ts";
import { type DOMRectInit } from "./DOMRectReadOnly.ts";

export interface DOMQuadInit {
  p1?: DOMPointInit;
  p2?: DOMPointInit;
  p3?: DOMPointInit;
  p4?: DOMPointInit;
}

const toPoint = (point?: DOMPointInit): DOMPoint =>
  DOMPoint.fromPoint(point ?? defaultPoint());

export class DOMQuad {
  static fromRect(rect: DOMRectInit = {}): DOMQuad {
    _.webidl.assertBranded(this, DOMQuad);
    const x = toNumber(rect.x, 0);
    const y = toNumber(rect.y, 0);
    const width = toNumber(rect.width, 0);
    const height = toNumber(rect.height, 0);

    return new this(
      { x, y, z: 0, w: 1 },
      { x: x + width, y, z: 0, w: 1 },
      { x: x + width, y: y + height, z: 0, w: 1 },
      { x, y: y + height, z: 0, w: 1 },
    );
  }

  static fromQuad(quad: DOMQuadInit = {}): DOMQuad {
    _.webidl.assertBranded(this, DOMQuad);
    return new this(quad.p1, quad.p2, quad.p3, quad.p4);
  }

  #p1: DOMPoint;
  #p2: DOMPoint;
  #p3: DOMPoint;
  #p4: DOMPoint;

  constructor(
    p1?: DOMPointInit,
    p2?: DOMPointInit,
    p3?: DOMPointInit,
    p4?: DOMPointInit,
  ) {
    this.#p1 = toPoint(p1);
    this.#p2 = toPoint(p2);
    this.#p3 = toPoint(p3);
    this.#p4 = toPoint(p4);

    _.webidl.createBranded(this);
  }

  get p1(): DOMPoint {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    return this.#p1;
  }

  get p2(): DOMPoint {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    return this.#p2;
  }

  get p3(): DOMPoint {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    return this.#p3;
  }

  get p4(): DOMPoint {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    return this.#p4;
  }

  getBounds(): DOMRect {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    const { x: x1, y: y1 } = this.#p1;
    const { x: x2, y: y2 } = this.#p2;
    const { x: x3, y: y3 } = this.#p3;
    const { x: x4, y: y4 } = this.#p4;

    const minX = Math.min(x1, x2, x3, x4);
    const minY = Math.min(y1, y2, y3, y4);
    const maxX = Math.max(x1, x2, x3, x4);
    const maxY = Math.max(y1, y2, y3, y4);

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }

  toJSON(): DOMQuadInit {
    _.webidl.assertBranded(this, DOMQuadPrototype);
    return {
      p1: this.#p1.toJSON(),
      p2: this.#p2.toJSON(),
      p3: this.#p3.toJSON(),
      p4: this.#p4.toJSON(),
    };
  }

  declare readonly [SymbolToStringTag]: "DOMQuad";

  static {
    toStringTag("DOMQuad")(this);

    _.webidl.createBranded(this);
  }
}

const DOMQuadPrototype = _.webidl.createBranded(DOMQuad.prototype);
