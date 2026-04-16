#!/usr/bin/env -S deno run -Aq
// deno-lint-ignore-file no-console

import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST_DIR = join(ROOT_DIR, "npm", "dist");
const PACK_DIR = join(ROOT_DIR, "npm");

function parseArgs(argv: string[]) {
  const selectedPackages = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--package") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--package requires a package name");
      }
      selectedPackages.add(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return { selectedPackages };
}

async function listBuiltPackages(): Promise<string[]> {
  const packages: string[] = [];
  for await (const entry of Deno.readDir(DIST_DIR)) {
    if (entry.isDirectory) {
      packages.push(entry.name);
    }
  }
  return packages.sort((left, right) => left.localeCompare(right));
}

async function packPackage(packageName: string): Promise<void> {
  console.log(`Packing npm/dist/${packageName}`);
  const command = new Deno.Command("npm", {
    args: ["pack", join(DIST_DIR, packageName), "--pack-destination", PACK_DIR],
    cwd: ROOT_DIR,
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = await command.output();
  if (code !== 0) {
    throw new Error(`npm pack failed for ${packageName} with exit code ${code}`);
  }
}

async function main(): Promise<void> {
  const { selectedPackages } = parseArgs(Deno.args);
  const builtPackages = await listBuiltPackages();
  const packages = selectedPackages.size === 0
    ? builtPackages
    : builtPackages.filter((name) => selectedPackages.has(name));

  if (selectedPackages.size > 0 && packages.length !== selectedPackages.size) {
    const known = new Set(packages);
    const missing = [...selectedPackages].filter((name) => !known.has(name));
    throw new Error(`Missing built package(s): ${missing.join(", ")}`);
  }

  for (const packageName of packages) {
    await packPackage(packageName);
  }
}

if (import.meta.main) {
  await main();
}
