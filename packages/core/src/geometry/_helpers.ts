import type { DOMMatrix } from "./DOMMatrix.ts";
import type { DOMMatrixInit } from "./DOMMatrixReadOnly.ts";
import type { DOMPoint, DOMPointInit } from "./DOMPoint.ts";
import { internal as _ } from "dawm-internal";
import { Number, String, TypeError } from "dawm-internal/primordials";
import { isArray, isFloat32Array, isFloat64Array } from "dawm-internal/guards";

export const applyResult = (
  target: DOMMatrix,
  result: DOMMatrix,
): DOMMatrix => {
  _.DOMMatrix.setValues(target, _.DOMMatrix.getValues(result));
  return target;
};

export const parseNumberList = (value: string): number[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parts = trimmed.split(/[\s,]+/).filter(Boolean);
  return parts.map((part) => {
    const num = Number(part);
    if (num !== num) throw new TypeError("Invalid transform value");
    return num;
  });
};

export const parseMatrixValue = (transformList: string): number[] => {
  const text = String(transformList).trim();
  const matrix3dMatch = /^matrix3d\((.*)\)$/i.exec(text);
  if (matrix3dMatch) {
    const values = parseNumberList(matrix3dMatch[1]);
    if (values.length !== 16) {
      throw new TypeError("Invalid matrix3d() argument length");
    }
    return values;
  }

  const matrixMatch = /^matrix\((.*)\)$/i.exec(text);
  if (matrixMatch) {
    const values = parseNumberList(matrixMatch[1]);
    if (values.length !== 6) {
      throw new TypeError("Invalid matrix() argument length");
    }
    const [a, b, c, d, e, f] = values;
    return [
      a,
      b,
      0,
      0,
      c,
      d,
      0,
      0,
      0,
      0,
      1,
      0,
      e,
      f,
      0,
      1,
    ];
  }

  throw new TypeError("Invalid transform value");
};

export const IDENTITY_VALUES = [
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
];

export const toNumber = (
  value: number | undefined,
  fallback: number,
): number => {
  const num = +(value ?? fallback);
  return num === num ? num : fallback;
};

export const cloneValues = (values: number[]): number[] => values.slice();

export const isNumberSequence = (value: unknown): value is ArrayLike<number> =>
  isArray(value) || isFloat32Array(value) || isFloat64Array(value);

export const valuesFromSequence = (sequence: ArrayLike<number>): number[] => {
  const length = sequence.length >>> 0;
  if (length === 6) {
    const a = toNumber(sequence[0], 1);
    const b = toNumber(sequence[1], 0);
    const c = toNumber(sequence[2], 0);
    const d = toNumber(sequence[3], 1);
    const e = toNumber(sequence[4], 0);
    const f = toNumber(sequence[5], 0);
    return [
      a,
      b,
      0,
      0,
      c,
      d,
      0,
      0,
      0,
      0,
      1,
      0,
      e,
      f,
      0,
      1,
    ];
  }
  if (length === 16) {
    return [
      toNumber(sequence[0], 1),
      toNumber(sequence[1], 0),
      toNumber(sequence[2], 0),
      toNumber(sequence[3], 0),
      toNumber(sequence[4], 0),
      toNumber(sequence[5], 1),
      toNumber(sequence[6], 0),
      toNumber(sequence[7], 0),
      toNumber(sequence[8], 0),
      toNumber(sequence[9], 0),
      toNumber(sequence[10], 1),
      toNumber(sequence[11], 0),
      toNumber(sequence[12], 0),
      toNumber(sequence[13], 0),
      toNumber(sequence[14], 0),
      toNumber(sequence[15], 1),
    ];
  }
  throw new TypeError("Invalid DOMMatrix sequence length");
};
const valuesFromInit = (init: DOMMatrixInit): number[] => {
  if (init.isIdentity) return cloneValues(IDENTITY_VALUES);

  const a = toNumber(init.a, 1);
  const b = toNumber(init.b, 0);
  const c = toNumber(init.c, 0);
  const d = toNumber(init.d, 1);
  const e = toNumber(init.e, 0);
  const f = toNumber(init.f, 0);

  if (init.is2D) {
    return [
      a,
      b,
      0,
      0,
      c,
      d,
      0,
      0,
      0,
      0,
      1,
      0,
      e,
      f,
      0,
      1,
    ];
  }

  return [
    toNumber(init.m11 ?? a, 1),
    toNumber(init.m12 ?? b, 0),
    toNumber(init.m13, 0),
    toNumber(init.m14, 0),
    toNumber(init.m21 ?? c, 0),
    toNumber(init.m22 ?? d, 1),
    toNumber(init.m23, 0),
    toNumber(init.m24, 0),
    toNumber(init.m31, 0),
    toNumber(init.m32, 0),
    toNumber(init.m33, 1),
    toNumber(init.m34, 0),
    toNumber(init.m41 ?? e, 0),
    toNumber(init.m42 ?? f, 0),
    toNumber(init.m43, 0),
    toNumber(init.m44, 1),
  ];
};

export const resolveValues = (
  init?: DOMMatrixInit | ArrayLike<number> | null,
): number[] => {
  if (init == null) return cloneValues(IDENTITY_VALUES);
  if (isNumberSequence(init)) return valuesFromSequence(init);
  return valuesFromInit(init);
};

export const is2DValues = (values: number[]): boolean =>
  values[2] === 0 &&
  values[3] === 0 &&
  values[6] === 0 &&
  values[7] === 0 &&
  values[8] === 0 &&
  values[9] === 0 &&
  values[10] === 1 &&
  values[11] === 0 &&
  values[14] === 0 &&
  values[15] === 1;

export const isIdentityValues = (values: number[]): boolean =>
  values[0] === 1 &&
  values[1] === 0 &&
  values[2] === 0 &&
  values[3] === 0 &&
  values[4] === 0 &&
  values[5] === 1 &&
  values[6] === 0 &&
  values[7] === 0 &&
  values[8] === 0 &&
  values[9] === 0 &&
  values[10] === 1 &&
  values[11] === 0 &&
  values[12] === 0 &&
  values[13] === 0 &&
  values[14] === 0 &&
  values[15] === 1;

export const multiplyValues = (a: number[], b: number[]): number[] => {
  const out = new Array<number>(16);
  for (let col = 0; col < 4; col++) {
    const colIndex = col * 4;
    const b0 = b[colIndex];
    const b1 = b[colIndex + 1];
    const b2 = b[colIndex + 2];
    const b3 = b[colIndex + 3];

    out[colIndex] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    out[colIndex + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    out[colIndex + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    out[colIndex + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return out;
};

export const translationMatrix = (
  tx: number,
  ty: number,
  tz: number,
): number[] => [
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  tx,
  ty,
  tz,
  1,
];

export const scaleMatrix = (sx: number, sy: number, sz: number): number[] => [
  sx,
  0,
  0,
  0,
  0,
  sy,
  0,
  0,
  0,
  0,
  sz,
  0,
  0,
  0,
  0,
  1,
];

const degreesToRadians = (degrees: number): number => degrees * Math.PI / 180;

export const rotationXMatrix = (degrees: number): number[] => {
  const rad = degreesToRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    1,
    0,
    0,
    0,
    0,
    cos,
    sin,
    0,
    0,
    -sin,
    cos,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const rotationYMatrix = (degrees: number): number[] => {
  const rad = degreesToRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    cos,
    0,
    -sin,
    0,
    0,
    1,
    0,
    0,
    sin,
    0,
    cos,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const rotationZMatrix = (degrees: number): number[] => {
  const rad = degreesToRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return [
    cos,
    sin,
    0,
    0,
    -sin,
    cos,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const axisAngleMatrix = (
  x: number,
  y: number,
  z: number,
  degrees: number,
): number[] | null => {
  const length = Math.sqrt(x * x + y * y + z * z);
  if (!length) return null;

  const nx = x / length;
  const ny = y / length;
  const nz = z / length;
  const rad = degreesToRadians(degrees);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const t = 1 - cos;

  const m11 = t * nx * nx + cos;
  const m12 = t * nx * ny + sin * nz;
  const m13 = t * nx * nz - sin * ny;

  const m21 = t * nx * ny - sin * nz;
  const m22 = t * ny * ny + cos;
  const m23 = t * ny * nz + sin * nx;

  const m31 = t * nx * nz + sin * ny;
  const m32 = t * ny * nz - sin * nx;
  const m33 = t * nz * nz + cos;

  return [
    m11,
    m12,
    m13,
    0,
    m21,
    m22,
    m23,
    0,
    m31,
    m32,
    m33,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const skewXMatrix = (degrees: number): number[] => {
  const rad = degreesToRadians(degrees);
  const tan = Math.tan(rad);
  return [
    1,
    0,
    0,
    0,
    tan,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const skewYMatrix = (degrees: number): number[] => {
  const rad = degreesToRadians(degrees);
  const tan = Math.tan(rad);
  return [
    1,
    tan,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
  ];
};

export const invertValues = (values: number[]): number[] | null => {
  const matrix = [
    [values[0], values[4], values[8], values[12], 1, 0, 0, 0],
    [values[1], values[5], values[9], values[13], 0, 1, 0, 0],
    [values[2], values[6], values[10], values[14], 0, 0, 1, 0],
    [values[3], values[7], values[11], values[15], 0, 0, 0, 1],
  ];

  for (let i = 0; i < 4; i++) {
    let pivot = i;
    let pivotValue = Math.abs(matrix[i][i]);
    for (let row = i + 1; row < 4; row++) {
      const value = Math.abs(matrix[row][i]);
      if (value > pivotValue) {
        pivot = row;
        pivotValue = value;
      }
    }

    if (matrix[pivot][i] === 0) return null;
    if (pivot !== i) {
      const tmp = matrix[i];
      matrix[i] = matrix[pivot];
      matrix[pivot] = tmp;
    }

    const pivotRow = matrix[i];
    const divisor = pivotRow[i];
    for (let col = 0; col < 8; col++) {
      pivotRow[col] /= divisor;
    }

    for (let row = 0; row < 4; row++) {
      if (row === i) continue;
      const factor = matrix[row][i];
      if (factor === 0) continue;
      for (let col = 0; col < 8; col++) {
        matrix[row][col] -= factor * pivotRow[col];
      }
    }
  }

  return [
    matrix[0][4],
    matrix[1][4],
    matrix[2][4],
    matrix[3][4],
    matrix[0][5],
    matrix[1][5],
    matrix[2][5],
    matrix[3][5],
    matrix[0][6],
    matrix[1][6],
    matrix[2][6],
    matrix[3][6],
    matrix[0][7],
    matrix[1][7],
    matrix[2][7],
    matrix[3][7],
  ];
};

export const createDOMMatrix = (values: number[]): DOMMatrix =>
  _.DOMMatrix.create(values) as DOMMatrix;

export const createDOMPoint = (
  x: number,
  y: number,
  z: number,
  w: number,
): DOMPoint => _.DOMPoint.create(x, y, z, w) as DOMPoint;

export const defaultPoint = (): DOMPointInit => ({ x: 0, y: 0, z: 0, w: 1 });
