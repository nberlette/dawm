#!/usr/bin/env -S deno run -Aq

/*!
 * Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.
 */
// deno-lint-ignore-file no-import-prefix no-console
import path from "node:path";
import { $ } from "jsr:@david/dax@0.44.1";
import process from "node:process";
import { Buffer } from "node:buffer";
import { brotliCompressSync, constants } from "node:zlib";

const name = "dawm";
const outDir = "src/wasm";

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

async function build(...args: string[]) {
  await requires("rustup", "rustc", "cargo");

  if (!(await $.path("Cargo.toml").stat())?.isFile) {
    err(`the build script should be executed in the "${name}" root`);
  }

  if (!await $.commandExists("wasm-bindgen")) {
    await $`cargo install -f wasm-bindgen-cli`.printCommand(true);
  }

  const wasmpack = async (env: Record<string, string> = {}) =>
    await $`deno run -Aq npm:wasm-pack@0.13.1 build --release --target deno --no-pack --out-name ${name} --out-dir ../${outDir} rs_lib`
      .printCommand(true).env(env);

  const firstAttempt = await wasmpack().catch(() => null);
  if (firstAttempt === null) {
    await patch_wasm_opt(...args);
    await wasmpack();
  }

  log(`build completed successfully`, 32);

  await inline_wasm(...args);
}

async function patch_wasm_opt(...args: string[]) {
  // find wasm-opt installation(s)
  let WASM_OPT_BINARY = await $.which("wasm-opt").catch(() => undefined);
  let seenPatchedFile = false;
  if (!WASM_OPT_BINARY) {
    // wasm-opt dir structure is like so:
    // /home/vscode/.cache/.wasm-pack/wasm-opt-1ceaaea8b7b5f7e0/bin/wasm-opt
    const baseDir = [
      path.join(process.env.HOME ?? "", ".cache", ".wasm-pack"),
    ];
    outer: for (const base of baseDir) {
      inner: for await (const entry of $.path(base).readDir()) {
        if (entry.isDirectory && entry.name.startsWith("wasm-opt-")) {
          const candidate = path.join(base, entry.name, "bin", "wasm-opt");
          const patchedFile = path.join(base, entry.name, "bin", "wasm-opt.sh");
          const stat = await $.path(patchedFile).stat() ?? null;
          if (stat?.isFile) {
            seenPatchedFile = true;
            continue inner; // skip already patched files
          }
          const stat2 = await $.path(candidate).stat() ?? null;
          if (stat2?.isFile) {
            WASM_OPT_BINARY = candidate;
            break outer; // found it
          }
        }
      }
    }
  }

  if (!WASM_OPT_BINARY && !args.includes("--no-opt") && !seenPatchedFile) {
    err(
      "could not find wasm-opt installation; please install binary or pass --no-opt to skip optimization",
    );
  }

  // patch wasm-opt binary(s) for our environment
  if (WASM_OPT_BINARY) {
    process.env.WASM_OPT_BINARY = WASM_OPT_BINARY;
    log(`using wasm-opt binary at ${WASM_OPT_BINARY}`);
    const scriptsDir = import.meta.dirname ??
      new URL(".", import.meta.url).pathname;
    log(`patching wasm-opt binary for DAWM build environment`);
    const code = await $`./patch_wasm_opt.sh`.quiet().env({ WASM_OPT_BINARY })
      .cwd(scriptsDir).code();
    if (code !== 0) {
      err(`failed to patch wasm-opt binary. run again with --no-opt`);
    }
  }
}

async function inline_wasm(...args: string[]) {
  // inline wasm in JS file as base64, replacing wasm loading code
  const glue = $.path(outDir).join(name + ".js");
  const glue_dts = glue.withExtname(".d.ts");

  const dest = glue.withBasename("index.js");
  const dest_dts = glue_dts.withBasename("index.d.ts");

  const wasm = $.path(outDir).join(name + "_bg.wasm");
  const wasm_src = await wasm.readBytes();

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
    glue_src = `import "jsr:@nick/utf8/shim";\n${glue_src}`;
  }
  // we WILL be using atob() to decode base64 strings, so we add a side-effect
  // import from `@nick/atob/shim` to ensure it's always available.
  glue_src = `import "jsr:@nick/atob/shim";\n${glue_src}`;
  glue_dts_src = $.dedent`
    // deno-lint-ignore-file
    // deno-coverage-ignore-file
    // @ts-nocheck -- generated file
    ${glue_dts_src.replace(/\/\*\s*[et]slint[-\s\w:]+\*\/\s*\n/g, "")}
  `;

  let final_wasm = wasm_src;
  let byte_str = "bytes";
  if (process.env.BROTLI !== "0" && !args.includes("--no-brotli")) {
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
  const b64 = Buffer.from(final_wasm).toString("base64");
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
    const bytes = ${loader};
    const wasmModule = new WebAssembly.Module(bytes);
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

  // rename dawm.js -> index.js
  await glue.rename(dest);
  // rename dawm.d.ts -> index.d.ts
  await glue_dts.rename(dest_dts);
  // write modified glue code with inlined wasm
  await dest.writeText(loader);
  // format things
  // await $`deno fmt -q --no-config ${dest.dirname()}`.quiet().code();
  await $`deno bundle -q --minify --external=debrotli --packages=bundle --vendor --output=${dest} --platform=browser --format=esm ${dest}`;

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

if (import.meta.main) await build(...process.argv.slice(2));
