#!/usr/bin/env -S deno run -Aq

/*!
 * Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.
 */
// deno-lint-ignore-file no-import-prefix no-console
import { $, Path } from "jsr:@david/dax@0.44.1";
import process from "node:process";
import { Buffer } from "node:buffer";
import { brotliCompressSync, constants } from "node:zlib";

const name = "dawm";
const outDir = "src/wasm";
const srcDir = "rs_lib";

const scriptsDir = $.path(new URL(".", import.meta.url).pathname);

console.debug(`scriptsDir: ${scriptsDir}`);

const glue = $.path(outDir).join(name + ".js");
const glue_dts = glue.withExtname(".d.ts");

const dest = glue.withBasename("index.js");
const dest_dts = glue_dts.withBasename("index.d.ts");

const wasm = $.path(outDir).join(name + "_bg.wasm");

const minify = process.env.MINIFY !== "0" &&
  !process.argv.includes("--no-minify");
const brotli = process.env.BROTLI !== "0" &&
  !process.argv.includes("--no-brotli");

const wasmPackVersion = process.env.WASM_PACK_VERSION || "0.13.1";
const wasmPackTarget = process.env.WASM_PACK_TARGET || "deno";
const wasmPackMode = process.env.DEBUG || process.argv.includes("--debug")
  ? "dev"
  : process.env.PROFILE
  ? "profiling"
  : "release";
const maybeNoOpt =
  process.env.WASM_OPT === "0" || process.env.WASM_OPT_LEVEL === "0" ||
    process.argv.includes("--no-opt") || process.argv.includes("--skip-opt")
    ? "--no-opt"
    : "";

async function wasmpack(
  src: string | Path = srcDir,
  out: string | Path = `../${outDir}`,
  env: Record<string, string> = {},
) {
  try {
    const result =
      await $`deno run -Aq npm:wasm-pack@${wasmPackVersion} build --${wasmPackMode} --weak-refs --reference-types --target ${wasmPackTarget} --no-pack --no-opt --out-name ${name} --out-dir ${out} ${src}`
        .printCommand(true).env(env);
    return result;
  } catch {
    return null;
  }
}

async function requires(...executables: string[]) {
  for (const executable of executables) {
    if (!await $.commandExists(executable)) {
      err(`required executable "${executable}" not found in PATH`);
    }
  }
}

function log(
  text: string,
  color: string | number = 2,
  logger: "log" | "error" | "warn" | "debug" = "log",
): void {
  if (logger === "log") {
    const firstSpace = text.indexOf(" ");
    const first = text.slice(0, firstSpace);
    const rest = text.slice(firstSpace);
    text = `\x1b[92m${first}\x1b[0m ${rest}`;
  }
  console[logger](`\x1b[${color}m[${logger}]\x1b[0m ${text}`);
}

function err(text: string): never {
  log(text, "1;31", "error");
  return process.exit(1);
}

async function build() {
  await requires("rustup", "rustc", "cargo");

  if (!(await $.path(srcDir).join("Cargo.toml").stat())?.isFile) {
    err(`the build script should be executed in the "${name}" root`);
  }

  if (!await $.commandExists("wasm-bindgen")) {
    await $`cargo install -f wasm-bindgen-cli`.printCommand(true);
  }

  await wasmpack(srcDir);
  log(`build completed successfully`, 32);

  if (!maybeNoOpt) await wasm_opt(wasm);

  await inline_wasm();
  log(`inlined wasm successfully`, 32);
}

type OptLevel = "0" | "1" | "2" | "3" | "4" | "s" | "z";

async function wasm_opt(
  wasmPath: string | Path,
  optLevel?: OptLevel,
): Promise<void> {
  const wasm_opt = scriptsDir.join(".wasm_opt", "wasm-opt");
  if (!await wasm_opt.exists()) {
    await $`deno -A ./download_wasm_opt.ts`.cwd(scriptsDir).printCommand(true);
  }
  optLevel ??= process.env.WASM_OPT_LEVEL as OptLevel || "4";
  log(`optimizing wasm with wasm-opt -O${optLevel}`, 36);
  await $`${wasm_opt} -O${optLevel} --all-features --enable-bulk-memory --enable-reference-types -o ${wasmPath} ${wasmPath}`
    .printCommand(true);
}

async function inline_wasm() {
  let glue_src = await glue.readText();
  let glue_dts_src = await glue_dts.readText();

  // get rid of eslint/tslint disable comments in the glue code file
  glue_src = glue_src.replace(/\/\*\s*[et]slint[-\s\w:]+\*\/\n/g, "");

  // if there isn't a `let wasm;` at the beginning of the file, add it.
  if (glue_src.indexOf("let wasm;") === -1) {
    glue_src = `let wasm;\n${glue_src}`;
  }
  // if there are references to `TextEncoder`, `TextDecoder`, add a side-effect
  // import from `@nick/utf8/shim` to ensure they're always available.
  if (
    glue_src.includes("TextEncoder") ||
    glue_src.includes("TextDecoder")
  ) {
    glue_src = `import "jsr:@nick/utf8@0.4.1/shim";\n${glue_src}`;
  }
  // we WILL be using atob() to decode base64 strings, so we add a side-effect
  // import from `@nick/atob/shim` to ensure it's always available.
  glue_src = `import "jsr:@nick/atob@0.3.0/shim";\n${glue_src}`;

  glue_dts_src = $.dedent`
    // deno-lint-ignore-file
    // deno-coverage-ignore-file
    // @ts-nocheck -- generated file
    ${glue_dts_src.replace(/\/\*\s*[et]slint[-\s\w:]+\*\/\s*\n/g, "")}
  `;

  const wasm_src = await wasm.readBytes();
  let final_wasm = wasm_src, byte_str = "bytes";

  // allow brotli to be bypassed via env var or CLI arg
  if (brotli) {
    byte_str = `decompress(${byte_str})`;
    // add import from debrotli module for decompression
    glue_src = `import { decompress } from "debrotli";\n${glue_src}`;
    // compress wasm using brotli
    final_wasm = brotliCompressSync(wasm_src, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
        [constants.BROTLI_PARAM_LGWIN]: 22,
        [constants.BROTLI_PARAM_LGBLOCK]: 0,
        [constants.BROTLI_PARAM_SIZE_HINT]: wasm_src.length,
      },
    });
  }

  let b64 = "";
  // we use native encoding/decoding to base64 when available
  if ("toBase64" in final_wasm && typeof final_wasm.toBase64 === "function") {
    b64 = final_wasm.toBase64({ alphabet: "base64", omitPadding: false });
  } else {
    b64 = Buffer.from(final_wasm).toString("base64");
  }
  let loader = `base64decode("\\\n${b64.replace(/.{77}/g, "$&\\\n")}\\\n")`;

  // marks the beginning of the area we want to replace
  const startMark = `const wasmUrl = new URL(`;
  const startIdx = glue_src.indexOf(startMark);
  if (startIdx === -1) err(`could not find wasm loading code in ${glue}`);

  const endMark = `export { wasm as __wasm };`;
  let endIdx = glue_src.indexOf(endMark, startIdx);
  // default to the end of the file if for some weird reason we can't find
  // the known end marker. this should never happen, but hey. why not.
  if (endIdx === -1) endIdx = glue_src.length - 1;

  const before = glue_src.slice(0, startIdx);
  const after = glue_src.slice(endIdx);
  loader = $.dedent`
    ${before}
    const wasmBytes = ${loader};
    const wasmModule = new WebAssembly.Module(wasmBytes);
    const instance = new WebAssembly.Instance(wasmModule, imports);
    wasm = instance.exports;

    function base64decode(b64) {
      let bytes;
      if (typeof Uint8Array.fromBase64 === "function") {
        // for modern runtimes with native Uint8Array.fromBase64 support
        bytes = Uint8Array.fromBase64(b64);
      } else {
        // legacy atob-based decoder for older runtimes
        const binString = atob(b64);
        const size = binString.length;
        bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
      }
      return ${byte_str};
    }
    ${after}
  `;

  // clean some things up
  await wasm.withBasename(".gitignore").ensureRemove();
  const wasm_dts = wasm.withExtname(".wasm.d.ts");
  await wasm_dts.ensureRemove();
  await wasm.ensureRemove();

  // rename dawm.d.ts -> index.d.ts
  await glue_dts.rename(dest_dts);
  // write modified glue code with inlined wasm
  await glue.writeText(loader);
  // format things
  // await $`deno fmt -q --no-config ${dest.dirname()}`.quiet().code();
  await $`deno bundle -q ${
    minify ? "--minify" : ""
  } --external=debrotli --packages=bundle --output=${dest} --platform=browser --format=esm ${glue}`;

  await glue.ensureRemove();

  const bundled = await dest.readText();

  await dest.writeText($.dedent`
    /*!
     * Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.
     * @see https://nick.mit-license.org/2025 for the full license text.
     * @see https://github.com/nberlette/dawm for the original source.
     */
    /// <reference types="./${dest_dts.basename()}" />
    // deno-fmt-ignore-file
    // deno-lint-ignore-file
    // deno-coverage-ignore-file
    // @ts-nocheck -- generated file
    // @ts-self-types="./${dest_dts.basename()}"
    // deno-coverage-ignore-start
    ${bundled}
    // deno-coverage-ignore-stop
  `);

  const final_size = final_wasm.byteLength;
  log(`-> final wasm size: ${pretty_bytes(final_size)}`, 36);
  log(`-> wrote inline wasm + glue to ${dest}`);
  log(`-> wrote type declarations to ${dest_dts}`);
  log(
    `-> final size of inline wasm + glue: ${
      pretty_bytes(dest.statSync()?.size ?? 0)
    }`,
    36,
  );
}

function pretty_bytes(
  size: number | string,
  precision = 2,
  iec = false,
  unitOverride?: string,
): string {
  const units_si = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const units_iec = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;
  size = +size;
  if (isNaN(size) || !isFinite(size)) return "NaN";
  const units = iec ? units_iec : units_si;
  const factor = iec ? 1024 : 1000;
  let i = 0;
  for (i = 0; size >= factor && i < units.length - 1; size /= factor, i++);
  size = (+size.toFixed(precision)).toLocaleString(["en-US"], {
    useGrouping: true,
    maximumFractionDigits: precision,
    style: "decimal",
  });
  return `${size} ${unitOverride ?? units[i]}`;
}

if (import.meta.main) await build();
