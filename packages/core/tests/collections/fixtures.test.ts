import { describe, it } from "node:test";
import { HTMLDocument } from "../../../html/src/HTMLDocument.ts";
import {
  assertFixtureOutput,
  loadTextFixtures,
  parseJSONFixture,
  type TextFixture,
  toSnapshot,
} from "../../../../test-support/_fixtures.ts";

type ClassListOp =
  | { op: "add"; args: string[] }
  | { op: "remove"; args: string[] }
  | { op: "toggle"; token: string; force?: boolean }
  | { op: "replace"; from: string; to: string }
  | { op: "contains"; token: string }
  | { op: "item"; index: number }
  | { op: "set-value"; value: string };

type DatasetOp =
  | { op: "set"; key: string; value: string }
  | { op: "delete"; key: string }
  | { op: "get"; key: string }
  | { op: "has"; key: string }
  | { op: "keys" };

type CollectionFixtureInput =
  | {
    kind: "class-list";
    tagName?: string;
    initialClass?: string;
    ops: ClassListOp[];
  }
  | {
    kind: "dataset";
    tagName?: string;
    initialAttributes?: Record<string, string>;
    ops: DatasetOp[];
  };

function snapshotAttributes(el: any): Array<[string, string]> {
  const attrs: Array<[string, string]> = [];
  const map = el.attributes;
  for (let i = 0; i < map.length; i++) {
    const attr = map.item(i);
    if (attr) attrs.push([attr.name, attr.value]);
  }
  return attrs.sort((a, b) => a[0].localeCompare(b[0]));
}

function runClassListFixture(
  input: Extract<CollectionFixtureInput, { kind: "class-list" }>,
): string {
  const doc = new HTMLDocument();
  const el = doc.createElement(input.tagName ?? "div");
  if (input.initialClass != null) {
    el.setAttribute("class", input.initialClass);
  }

  const list = el.classList;
  const results: Array<Record<string, unknown>> = [];

  for (const op of input.ops) {
    switch (op.op) {
      case "add":
        list.add(...op.args);
        results.push({ op: op.op, args: op.args });
        break;
      case "remove":
        list.remove(...op.args);
        results.push({ op: op.op, args: op.args });
        break;
      case "toggle":
        results.push({
          force: op.force ?? null,
          op: op.op,
          result: list.toggle(op.token, op.force),
          token: op.token,
        });
        break;
      case "replace":
        results.push({
          from: op.from,
          op: op.op,
          result: list.replace(op.from, op.to),
          to: op.to,
        });
        break;
      case "contains":
        results.push({
          op: op.op,
          result: list.contains(op.token),
          token: op.token,
        });
        break;
      case "item":
        results.push({
          index: op.index,
          op: op.op,
          result: list.item(op.index),
        });
        break;
      case "set-value":
        list.value = op.value;
        results.push({ op: op.op, value: op.value });
        break;
    }
  }

  return toSnapshot({
    attributes: snapshotAttributes(el),
    classAttribute: el.getAttribute("class"),
    length: list.length,
    results,
    tokens: [...list],
    value: list.value,
  });
}

function runDatasetFixture(
  input: Extract<CollectionFixtureInput, { kind: "dataset" }>,
): string {
  const doc = new HTMLDocument();
  const el = doc.createElement(input.tagName ?? "div");
  const initialAttributes = input.initialAttributes ?? {};
  for (const [name, value] of Object.entries(initialAttributes)) {
    el.setAttribute(name, value);
  }

  const dataset = el.dataset as Record<string, string | undefined>;
  const results: Array<Record<string, unknown>> = [];

  for (const op of input.ops) {
    switch (op.op) {
      case "set":
        dataset[op.key] = op.value;
        results.push({ key: op.key, op: op.op, value: op.value });
        break;
      case "delete":
        results.push({
          key: op.key,
          op: op.op,
          result: delete dataset[op.key],
        });
        break;
      case "get":
        results.push({
          key: op.key,
          op: op.op,
          result: dataset[op.key] ?? null,
        });
        break;
      case "has":
        results.push({ key: op.key, op: op.op, result: op.key in dataset });
        break;
      case "keys":
        results.push({ keys: Object.keys(dataset).sort(), op: op.op });
        break;
    }
  }

  const datasetSnapshot: Record<string, string> = {};
  for (const key of Object.keys(dataset).sort()) {
    const value = dataset[key];
    if (value != null) datasetSnapshot[key] = value;
  }

  return toSnapshot({
    attributes: snapshotAttributes(el),
    dataAttributes: snapshotAttributes(el).filter(([name]) =>
      name.startsWith("data-")
    ),
    dataset: datasetSnapshot,
    results,
  });
}

function runFixture(fixture: TextFixture): string {
  const input = parseJSONFixture<CollectionFixtureInput>(fixture);
  if (input.kind === "class-list") return runClassListFixture(input);
  return runDatasetFixture(input);
}

describe("collections/fixtures", () => {
  const fixtures = loadTextFixtures("collections", { extensions: [".json"] });
  for (const fixture of fixtures) {
    it(`matches fixture output: ${fixture.relPath}`, () => {
      const actual = runFixture(fixture);
      assertFixtureOutput(fixture, actual);
    });
  }
});
