import assert from "node:assert";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export interface TextFixture {
  absPath: string;
  relPath: string;
  input: string;
  outputPath: string;
}

export interface FixtureLoadOptions {
  extensions?: string[];
  requireOutput?: boolean;
}

const SUPPORT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = dirname(SUPPORT_DIR);
const TESTDATA_DIR = join(ROOT_DIR, "testdata");
const UPDATE_FIXTURES = Deno.env.get("UPDATE_TEST_FIXTURES") === "1";

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const out: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const next = stack.pop()!;
    const entries = readdirSync(next, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      const abs = join(next, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile()) {
        out.push(abs);
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function loadTextFixtures(
  domainPath: string,
  options: FixtureLoadOptions = {},
): TextFixture[] {
  const requireOutput = options.requireOutput ?? true;
  const fixtureRoot = join(TESTDATA_DIR, domainPath);
  const includeExts = options.extensions?.map((ext) => ext.toLowerCase()) ??
    null;

  const allFiles = walkFiles(fixtureRoot);
  const inputFiles = allFiles.filter((absPath) => {
    if (absPath.endsWith(".out")) return false;
    if (!includeExts) return true;
    return includeExts.includes(extname(absPath).toLowerCase());
  });

  return inputFiles.map((absPath) => {
    const relPath = relative(fixtureRoot, absPath).replaceAll("\\", "/");
    const outputPath = `${absPath}.out`;
    if (requireOutput && !existsSync(outputPath) && !UPDATE_FIXTURES) {
      throw new Error(
        `Missing expected fixture output: ${relative(ROOT_DIR, outputPath)}`,
      );
    }
    return {
      absPath,
      relPath,
      input: normalizeText(readFileSync(absPath, "utf8")),
      outputPath,
    };
  });
}

export function parseJSONFixture<T>(fixture: TextFixture): T {
  return JSON.parse(fixture.input) as T;
}

function normalizeText(value: string): string {
  return value.replaceAll("\r\n", "\n");
}

function normalizeNumber(value: number, precision: number): number | string {
  if (Number.isNaN(value)) return "NaN";
  if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
  const scale = 10 ** precision;
  const rounded = Math.round(value * scale) / scale;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalizeSnapshotValue(
  value: unknown,
  precision: number,
): unknown {
  if (typeof value === "number") return normalizeNumber(value, precision);
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeSnapshotValue(entry, precision));
  }
  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    const out: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      out[key] = normalizeSnapshotValue(
        (value as Record<string, unknown>)[key],
        precision,
      );
    }
    return out;
  }
  return value;
}

export function toSnapshot(value: unknown, precision = 6): string {
  const normalized = normalizeSnapshotValue(value, precision);
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

export function assertFixtureOutput(
  fixture: TextFixture,
  actual: string,
): void {
  const normalizedActual = normalizeText(actual);

  if (UPDATE_FIXTURES) {
    mkdirSync(dirname(fixture.outputPath), { recursive: true });
    writeFileSync(fixture.outputPath, normalizedActual);
    return;
  }

  const expected = normalizeText(readFileSync(fixture.outputPath, "utf8"));
  assert.strictEqual(
    normalizedActual,
    expected,
    [
      `Fixture output mismatch for: ${fixture.relPath}`,
      `Input: ${relative(ROOT_DIR, fixture.absPath)}`,
      `Expected: ${relative(ROOT_DIR, fixture.outputPath)}`,
      `To update snapshots: UPDATE_TEST_FIXTURES=1 deno test ...`,
    ].join("\n"),
  );
}
