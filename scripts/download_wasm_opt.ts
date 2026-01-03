#!/usr/bin/env -S node --experimental-transform-types --experimental-strip-types --no-warnings --preserve-symlinks

// inspired by MrRefactoring's CommonJS wasm-opt downloader
// https://github.com/MrRefactoring/wasm-opt/blob/master/bin/index.js
// deno-lint-ignore-file no-console

import $ from "jsr:@david/dax@0.44.1";
import * as fs from "node:fs";
import {
  access,
  chmod,
  copyFile,
  mkdir,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BINARYEN_VERSION = 125 as const;

const OS = process.platform;
const ARCH = process.arch;

const BASE_URL =
  `https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}`;

const EXE = OS === "win32" ? "wasm-opt.exe" : "wasm-opt";
const UNPACKED_DIR = `binaryen-version_${BINARYEN_VERSION}` as const;

const LIB_BY_PLATFORM = {
  win32: "binaryen.lib",
  linux: "libbinaryen.a",
  darwin: "libbinaryen.dylib",
} as Partial<Record<NodeJS.Platform, string>>;

function platformError(): Error {
  return new Error("\x1b[33mThis platform not supported\x1b[0m");
}

const OS_MAP = {
  win32: "windows",
  linux: "linux",
  darwin: "macos",
} as Partial<Record<NodeJS.Platform, string>>;

const ARCH_MAP = {
  x64: "x86_64",
  arm64: OS === "linux" ? "aarch64" : "arm64",
} as Partial<Record<NodeJS.Architecture, string>>;

function getUrl(): string {
  const arch = ARCH_MAP[ARCH];
  const os = OS_MAP[OS];
  if (arch && os) {
    return `${BASE_URL}/binaryen-version_${BINARYEN_VERSION}-${arch}-${os}.tar.gz`;
  }

  throw platformError();
}

async function rimraf(p: string): Promise<void> {
  await rm(p, { recursive: true, force: true }).catch(() => {});
}

function exists(p: string): Promise<boolean> {
  return access(p, fs.constants.F_OK).then(
    () => true,
    () => false,
  );
}

async function main(): Promise<void> {
  const libName = LIB_BY_PLATFORM[OS as keyof typeof LIB_BY_PLATFORM];
  if (!libName) throw platformError();

  const tmpDir = path.resolve(__dirname, ".tmp");
  const packedFile = path.resolve(tmpDir, "binaries.tar");

  if (await exists(packedFile)) await unlink(packedFile);

  const unpackedRoot = path.resolve(tmpDir, UNPACKED_DIR);
  const unpackedBin = path.resolve(unpackedRoot, "bin");
  const downloadedBin = path.resolve(unpackedBin, EXE);
  const unpackedLib = path.resolve(unpackedRoot, "lib");
  const downloadedLib = path.resolve(unpackedLib, libName);

  const outDir = path.resolve(__dirname, ".wasm_opt");
  const outBin = path.resolve(outDir, EXE);
  const libDir = path.resolve(outDir, "lib");
  const outLib = path.resolve(libDir, libName);

  const cleanup = () => rimraf(tmpDir);

  process.prependOnceListener("exit", cleanup);
  // process.once("uncaughtException", cleanup);
  process.once("SIGINT", cleanup);

  try {
    const url = getUrl();
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `Failed to download ${url} (HTTP ${res.status} ${res.statusText})`,
      );
    }

    await mkdir(tmpDir, { recursive: true });
    await mkdir(libDir, { recursive: true });
    await mkdir(outDir, { recursive: true });

    await writeFile(packedFile, new Uint8Array(await res.arrayBuffer()));

    await $`tar -xf ${packedFile} -C ${tmpDir}`.printCommand(true);

    await copyFile(downloadedBin, outBin);
    await copyFile(downloadedLib, outLib);

    await chmod(outBin, 0o755);

    await unlink(packedFile);
    await rimraf(unpackedRoot);
    await rimraf(tmpDir);

    console.log(
      `\x1b[32mSuccessfully downloaded wasm-opt to ${outBin}\x1b[0m`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause = e instanceof Error ? e : undefined;
    throw new Error(`\x1b[31m${msg}\x1b[0m`, { cause });
  }
}

await main();
