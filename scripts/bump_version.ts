#!/usr/bin/env -S deno -Aq --unstable-net

// deno-lint-ignore-file no-import-prefix no-console no-explicit-any

import process from "node:process";
import { $ } from "jsr:@david/dax@0.44.1";
import * as semver from "jsr:@std/semver@1";

import pkg from "../deno.json" with { type: "json" };

let releaseType: semver.ReleaseType | null = null;
let newVersion: semver.SemVer | null = null;

function semverToString(this: semver.SemVer) {
  return semver.format(this);
}

function parse(version: string): semver.SemVer {
  const parsed = semver.parse(version);
  parsed.toString = semverToString;
  return parsed;
}

const oldVersion = parse(pkg.version);
oldVersion.toString = semverToString;

const releaseTypes = [
  "pre",
  "major",
  "minor",
  "patch",
  "premajor",
  "preminor",
  "prepatch",
  "prerelease",
] as const;

const isReleaseType = (s: any): s is semver.ReleaseType =>
  releaseTypes.includes(s);

const arg = process.argv[2];
if (isReleaseType(arg)) {
  releaseType = arg;
} else if (isReleaseType(process.env.RELEASE_TYPE)) {
  releaseType = process.env.RELEASE_TYPE;
} else if (semver.canParse(arg)) {
  newVersion = parse(arg);
  if (!semver.greaterThan(newVersion, oldVersion)) {
    console.error(
      `New version ${newVersion} is not greater than old version ${oldVersion}`,
    );
    process.exit(1);
  }
  releaseType = null;
}

if (releaseType) {
  newVersion = semver.increment(oldVersion, releaseType);
}

if (!newVersion && process.stdin.isTTY) {
  const options = [...releaseTypes];
  const input = await $.select({
    message: `Select release type (current: ${oldVersion})`,
    options,
    initialIndex: options.indexOf("patch"),
    noClear: true,
  });
  releaseType = options[input];
  newVersion = semver.increment(oldVersion, releaseType);
}

if (!newVersion) {
  console.error("No valid release type or version specified.");
  process.exit(1);
}

newVersion.toString = semverToString;

const ROOT_DIR = $.path("./").resolve();
const DENO_JSON = ROOT_DIR.join("deno.json");

let denoJson = await DENO_JSON.readText();
denoJson = denoJson.replace(
  /(?<="version"\s*:\s*")(.+?)(?=")/,
  `${newVersion}`,
);
await DENO_JSON.writeText(denoJson);
$.logStep("✔︎ bumped", `deno.json to version ${newVersion}`);

const NPM_DIR = ROOT_DIR.join("npm").resolve();
const PKG_JSON = NPM_DIR.join("package.json");

let pkgJson = await PKG_JSON.readText();
pkgJson = pkgJson.replace(/(?<="version"\s*:\s*")(.+?)(?=")/, `${newVersion}`);
await PKG_JSON.writeText(pkgJson);
$.logStep("✔︎ bumped", `package.json to version ${newVersion}`);

const RUST_DIR = ROOT_DIR.join("rs_lib").resolve();
const CARGO_TOML = RUST_DIR.join("Cargo.toml");

let cargoToml = await CARGO_TOML.readText();
cargoToml = cargoToml.replace(
  /(?<=\bversion\s*=\s*")(.+?)(?=")/,
  `${newVersion}`,
);
await CARGO_TOML.writeText(cargoToml);
$.logStep("✔︎ bumped", `Cargo.toml to version ${newVersion}`);

$.logLight("Updating cargo lockfile ...");
await $`cargo update -p dawm --manifest-path ${CARGO_TOML.toString()}`;
$.logStep("✔︎ updated", `Cargo.lock for dawm to version ${newVersion}`);

$.logStep("DONE", "Bumped all versions successfully!");
