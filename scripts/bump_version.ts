#!/usr/bin/env -S deno -Aq --unstable-net

// deno-lint-ignore-file no-import-prefix no-explicit-any

import process from "node:process";
import { $ } from "jsr:@david/dax@0.44.1";
import * as semver from "jsr:@std/semver@1";

import pkg from "../deno.json" with { type: "json" };

type SemVer = semver.SemVer;
type ReleaseType = semver.ReleaseType;
type VersionLike = string | semver.SemVer | Version;

interface Version extends SemVer {
  increment(releaseType: ReleaseType): Version;
  toString(prefix?: string): string;
}

let releaseType: ReleaseType | null = null;
let newVersion: Version | null = null;

function semverToString(this: Version, prefix?: string) {
  return (prefix ?? "") + semver.format(this);
}

function parse(version: VersionLike): Version {
  if (typeof version === "string") {
    version = semver.parse(version) as Version;
  }
  version.toString = semverToString.bind(version as Version);
  if (!("increment" in version)) {
    const v = version as Version;
    v.increment = increment.bind(version);
  }
  return version as Version;
}

function increment(this: VersionLike, releaseType: ReleaseType): Version {
  return parse(
    semver.increment(
      typeof this === "string" ? semver.parse(this) : this,
      releaseType,
    ),
  );
}

const oldVersion = parse(pkg.version);

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

const isReleaseType = (s: any): s is ReleaseType => releaseTypes.includes(s);

const arg = process.argv[2];
if (isReleaseType(arg)) {
  releaseType = arg;
} else if (isReleaseType(process.env.RELEASE_TYPE)) {
  releaseType = process.env.RELEASE_TYPE;
} else if (semver.canParse(arg)) {
  newVersion = parse(arg);
  if (!semver.greaterThan(newVersion, oldVersion)) {
    $.logError(
      "error",
      `New version ${newVersion} is not greater than old version ${oldVersion}`,
    );
    process.exit(1);
  }
  releaseType = null;
}

if (isReleaseType(releaseType)) {
  newVersion = oldVersion.increment(releaseType);
}

if (!newVersion && process.stdin.isTTY) {
  let options: string[] | (readonly [string, string])[] = [
    [`${oldVersion}`, `(no change)`],
    ...releaseTypes.map((t) =>
      [`${oldVersion.increment(t)}`, `(${t})`] as const
    ),
    [`_._._`, `(enter manually)`],
  ];
  const maxLeftLen = Math.max(...options.map(([s]) => s.length + 3));
  options = options.map(([l, r]) =>
    `${l} ${".".repeat(Math.max(0, maxLeftLen - l.length))} ${r}`
  );
  const input = await $.maybeSelect({
    message:
      `Select next version by SemVer release type (current: ${oldVersion})`,
    options,
    initialIndex: 0,
    noClear: true,
  });
  if (input) {
    if (input === options.length - 1) {
      const custom = await $.maybePrompt({
        message: `Enter a new semantic version number (current: ${oldVersion})`,
        default: oldVersion.toString(),
        noClear: true,
      });

      if (custom) {
        if (semver.canParse(custom)) {
          newVersion = parse(custom);
        } else {
          $.logError("error", `Invalid semantic version number: ${custom}`);
          process.exit(2);
        }
      }
    } else {
      const value = releaseTypes[input - 1];
      if (isReleaseType(value)) {
        newVersion = oldVersion.increment(value);
      }
    }
  } else {
    $.logWarn("Skipping version increment per user request.");
    process.exit(0);
  }
}

if (!newVersion) {
  $.logError("error", "No valid release type or version specified.");
  process.exit(1);
}

$.logStep(`Preparing to bump version to ${newVersion}...`);

const proceed = await $.maybeConfirm(
  `Proceed to update deno.json, package.json, and Cargo.toml?`,
  {
    default: true,
    noClear: true,
  },
);

if (!proceed) {
  $.logWarn("Skipping configuration update step. No files changed!");
  process.exit(0);
}

const ROOT_DIR = $.path("./").resolve();
const DENO_JSON = ROOT_DIR.join("deno.json");

let denoJson = await DENO_JSON.readText();
denoJson = denoJson.replace(
  /(?<="version"\s*:\s*")(.+?)(?=")/,
  `${newVersion}`,
);
await DENO_JSON.writeText(denoJson);
$.logStep("✔︎ bumped", `deno.json to ${newVersion}`);

const NPM_DIR = ROOT_DIR.join("npm").resolve();
const PKG_JSON = NPM_DIR.join("package.json");

let pkgJson = await PKG_JSON.readText();
pkgJson = pkgJson.replace(/(?<="version"\s*:\s*")(.+?)(?=")/, `${newVersion}`);
await PKG_JSON.writeText(pkgJson);
$.logStep("✔︎ bumped", `package.json to ${newVersion}`);

const RUST_DIR = ROOT_DIR.join("rs_lib").resolve();
const CARGO_TOML = RUST_DIR.join("Cargo.toml");

let cargoToml = await CARGO_TOML.readText();
cargoToml = cargoToml.replace(
  /(?<=\bversion\s*=\s*")(.+?)(?=")/,
  `${newVersion}`,
);
await CARGO_TOML.writeText(cargoToml);
$.logStep("✔︎ bumped", `Cargo.toml to ${newVersion}`);

$.logLight("Updating cargo lockfile ...");
await $`cargo update -p dawm --manifest-path ${CARGO_TOML.toString()}`;
$.logStep("✔︎ updated", `Cargo.lock for dawm to version ${newVersion}`);

$.logStep("DONE", "Bumped all versions successfully!");
