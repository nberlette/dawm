import { describe, it } from "node:test";
import { DOMMatrix } from "../../src/geometry/DOMMatrix.ts";
import type { DOMMatrixInit } from "../../src/geometry/DOMMatrixReadOnly.ts";
import { DOMPoint } from "../../src/geometry/DOMPoint.ts";
import type { DOMPointInit } from "../../src/geometry/DOMPointReadOnly.ts";
import {
  assertFixtureOutput,
  loadTextFixtures,
  parseJSONFixture,
  type TextFixture,
  toSnapshot,
} from "dawm-testing/fixtures";

interface MethodOp {
  method: string;
  args?: unknown[];
}

interface SetterOp {
  op: "set";
  property: "a" | "b" | "c" | "d" | "e" | "f" | `m${number}`;
  value: number;
}

type MatrixFixtureInput = {
  kind: "matrix";
  init?: DOMMatrixInit | number[];
  ops?: Array<MethodOp | SetterOp>;
  transformPoint?: DOMPointInit;
};

type PointFixtureInput = {
  kind: "point";
  init?: DOMPointInit;
  ops?: Array<
    | {
      op: "set";
      property: "x" | "y" | "z" | "w";
      value: number;
    }
    | {
      op: "matrixTransform";
      matrix: DOMMatrixInit | number[];
    }
    | {
      op: "toJSON";
    }
  >;
};

type GeometryFixtureInput = MatrixFixtureInput | PointFixtureInput;

function runMatrixFixture(input: MatrixFixtureInput): string {
  const matrix = new DOMMatrix(input.init as DOMMatrixInit | number[] | null);
  const matrixRecord = matrix as unknown as Record<string, unknown>;
  const ops = input.ops ?? [];
  const results: Array<Record<string, unknown>> = [];

  for (const op of ops) {
    if ("op" in op) {
      if (op.op !== "set") {
        throw new TypeError(`Unsupported DOMMatrix operation: ${op.op}`);
      }
      matrixRecord[op.property] = op.value;
      results.push({
        op: op.op,
        property: op.property,
        value: matrixRecord[op.property],
      });
      continue;
    }

    const fn = matrixRecord[op.method];
    if (typeof fn !== "function") {
      throw new TypeError(`Unknown DOMMatrix operation: ${op.method}`);
    }
    const result = (fn as (...args: unknown[]) => unknown).apply(
      matrix,
      op.args ?? [],
    );

    if (result === matrix || result === undefined) {
      results.push({ args: op.args ?? [], method: op.method, result: "self" });
    } else if (
      typeof result === "number" || typeof result === "boolean" ||
      typeof result === "string"
    ) {
      results.push({ args: op.args ?? [], method: op.method, result });
    } else if (result && typeof result === "object" && "toJSON" in result) {
      results.push({
        args: op.args ?? [],
        method: op.method,
        result: (result as { toJSON(): unknown }).toJSON(),
      });
    } else {
      results.push({
        args: op.args ?? [],
        method: op.method,
        result: String(result),
      });
    }
  }

  const transformed = input.transformPoint
    ? matrix.transformPoint(input.transformPoint).toJSON()
    : null;

  return toSnapshot({
    float32: Array.from(matrix.toFloat32Array()),
    float64: Array.from(matrix.toFloat64Array()),
    is2D: matrix.is2D,
    isIdentity: matrix.isIdentity,
    matrix: matrix.toJSON(),
    results,
    toString: matrix.toString(),
    transformedPoint: transformed,
  });
}

function runPointFixture(input: PointFixtureInput): string {
  const init = input.init ?? {};
  const point = new DOMPoint(init.x, init.y, init.z, init.w);
  const pointRecord = point as unknown as Record<string, unknown>;
  const ops = input.ops ?? [];
  const results: Array<Record<string, unknown>> = [];

  for (const op of ops) {
    switch (op.op) {
      case "set":
        pointRecord[op.property] = op.value;
        results.push({
          op: op.op,
          property: op.property,
          value: pointRecord[op.property],
        });
        break;
      case "matrixTransform":
        results.push({
          matrix: op.matrix,
          op: op.op,
          result: point.matrixTransform(op.matrix as DOMMatrixInit).toJSON(),
        });
        break;
      case "toJSON":
        results.push({ op: op.op, result: point.toJSON() });
        break;
    }
  }

  return toSnapshot({
    point: point.toJSON(),
    results,
  });
}

function runFixture(fixture: TextFixture): string {
  const input = parseJSONFixture<GeometryFixtureInput>(fixture);
  if (input.kind === "matrix") return runMatrixFixture(input);
  return runPointFixture(input);
}

describe("geometry/fixtures", () => {
  const fixtures = loadTextFixtures("geometry", { extensions: [".json"] });
  for (const fixture of fixtures) {
    it(`matches fixture output: ${fixture.relPath}`, () => {
      const actual = runFixture(fixture);
      assertFixtureOutput(fixture, actual);
    });
  }
});
