#!/usr/bin/env -S deno run -Aq

// deno-lint-ignore-file no-import-prefix no-console
import { $, Path } from "jsr:@david/dax@0.45.0";
import process from "node:process";
import { Buffer } from "node:buffer";
import { brotliCompressSync, constants } from "node:zlib";

interface WasmModuleConfig {
  id: "markup" | "css";
  crateDir: string;
  outDir: string;
  destPath: string;
  outName: string;
}

const modules: readonly WasmModuleConfig[] = [
  {
    id: "markup",
    crateDir: "packages/core/wasm",
    outDir: "packages/core/wasm/.wasm",
    destPath: "packages/core/src/parser.ts",
    outName: "dawm_markup",
  },
  {
    id: "css",
    crateDir: "packages/dawm-css-parser",
    outDir: "packages/dawm-css-parser/.wasm",
    destPath: "packages/dawm-css-parser/index.js",
    outName: "dawm_css",
  },
];

const scriptsDir = $.path(new URL(".", import.meta.url).pathname);

const minify = process.env.MINIFY !== "0" &&
  !process.argv.includes("--no-minify");
const brotli = process.env.BROTLI !== "0" &&
  !process.argv.includes("--no-brotli");

const wasmPackVersion = process.env.WASM_PACK_VERSION || "0.14.0";
const wasmPackTarget = process.env.WASM_PACK_TARGET || "deno";
const wasmPackMode = !!process.env.DEBUG || process.argv.includes("--debug")
  ? "dev"
  : process.env.PROFILE
  ? "profiling"
  : "release";
const maybeNoOpt = process.env.WASM_OPT === "0" ||
  process.env.WASM_OPT_LEVEL === "0" ||
  process.argv.includes("--no-opt") || process.argv.includes("--skip-opt");

type OptLevel = "0" | "1" | "2" | "3" | "4" | "s" | "z";

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

async function requires(...executables: string[]) {
  for (const executable of executables) {
    if (!await $.commandExists(executable)) {
      err(`required executable "${executable}" not found in PATH`);
    }
  }
}

async function wasmpack(module: WasmModuleConfig): Promise<void> {
  const outDir = $.path(module.outDir).resolve();
  await $`deno run -Aq npm:wasm-pack@${wasmPackVersion} build --${wasmPackMode} --weak-refs --reference-types --target ${wasmPackTarget} --no-pack --no-opt --out-name ${module.outName} --out-dir ${outDir} ${module.crateDir}`
    .printCommand(true);
}

async function wasmOpt(wasmPath: Path, optLevel?: OptLevel): Promise<void> {
  const wasmOptBin = scriptsDir.join(".wasm_opt", "wasm-opt");
  if (!await wasmOptBin.exists()) {
    await $`deno -A ./download_wasm_opt.ts`.cwd(scriptsDir).printCommand(true);
  }

  optLevel ??= process.env.WASM_OPT_LEVEL as OptLevel || "4";
  log(`optimizing wasm with wasm-opt -O${optLevel}: ${wasmPath}`, 36);
  await $`${wasmOptBin} -O${optLevel} --all-features --enable-bulk-memory --enable-reference-types -o ${wasmPath} ${wasmPath}`
    .printCommand(true);
}

async function inlineWasm(module: WasmModuleConfig) {
  const outDir = $.path(module.outDir);
  const glue = outDir.join(`${module.outName}.js`);
  const glueDts = outDir.join(`${module.outName}.d.ts`);
  const wasm = outDir.join(`${module.outName}_bg.wasm`);

  const dest = $.path(module.destPath);
  const destDts = dest.withExtname(".d.ts");

  let glueSrc = await glue.readText();
  let glueDtsSrc = await glueDts.readText();

  glueSrc = glueSrc.replace(/\/\*\s*[et]slint[-\s\w:]+\*\/\n/g, "");

  if (glueSrc.indexOf("let wasm;") === -1) {
    glueSrc = `let wasm;\n${glueSrc}`;
  }

  if (glueSrc.includes("TextEncoder") || glueSrc.includes("TextDecoder")) {
    glueSrc = `import "jsr:@nick/utf8@0.4.1/shim";\n${glueSrc}`;
  }

  glueSrc = `import "jsr:@nick/atob@0.3.0/shim";\n${glueSrc}`;

  glueDtsSrc = $.dedent`
    // deno-lint-ignore-file
    // deno-coverage-ignore-file
    // @ts-nocheck -- generated file
    ${glueDtsSrc.replace(/\/\*\s*[et]slint[-\s\w:]+\*\/\s*\n/g, "")}
  `;

  const wasmSrc = await wasm.readBytes();
  let finalWasm = wasmSrc;
  let byteExpr = "bytes";

  if (brotli) {
    byteExpr = `decompress(${byteExpr})`;
    glueSrc = `import { decompress } from "debrotli";\n${glueSrc}`;
    finalWasm = brotliCompressSync(wasmSrc, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
        [constants.BROTLI_PARAM_LGWIN]: 22,
        [constants.BROTLI_PARAM_LGBLOCK]: 0,
        [constants.BROTLI_PARAM_SIZE_HINT]: wasmSrc.length,
      },
    });
  }

  let b64 = "";
  if ("toBase64" in finalWasm && typeof finalWasm.toBase64 === "function") {
    b64 = finalWasm.toBase64({ alphabet: "base64", omitPadding: false });
  } else {
    b64 = Buffer.from(finalWasm).toString("base64");
  }

  const loader = `base64decode("\\\n${b64.replace(/.{77}/g, "$&\\\n")}\\\n")`;

  const startMark = "const wasmUrl = new URL(";
  const startIdx = glueSrc.indexOf(startMark);
  if (startIdx === -1) err(`could not find wasm loading code in ${glue}`);

  const endMark = "export { wasm as __wasm };";
  let endIdx = glueSrc.indexOf(endMark, startIdx);
  if (endIdx === -1) endIdx = glueSrc.length - 1;

  const before = glueSrc.slice(0, startIdx);
  const after = glueSrc.slice(endIdx);

  const importsExpr = glueSrc.includes("imports =")
    ? "imports"
    : glueSrc.includes("__wbg_get_imports()")
    ? "__wbg_get_imports()"
    : glueSrc.includes("_wbg_get_imports()")
    ? "_wbg_get_imports()"
    : null;
  const inlined = $.dedent`
    ${before}
    const wasmBytes = ${loader};
    const wasmModule = new WebAssembly.Module(wasmBytes);
    const wasmImports = ${importsExpr ?? "undefined"};
    const instance = new WebAssembly.Instance(
      wasmModule${importsExpr ? ", wasmImports" : ""}
    );
    wasm = instance.exports;
    initializeExternrefTable(wasm, wasmImports);

    function initializeExternrefTable(wasmExports, imports) {
      const importInitFn = resolveExternrefInit(imports);
      if (typeof importInitFn === "function") {
        importInitFn();
        return;
      }

      const externrefs = wasmExports?.__wbindgen_externrefs;
      if (
        !externrefs ||
        typeof externrefs.grow !== "function" ||
        typeof externrefs.set !== "function"
      ) {
        return;
      }
      const offset = externrefs.grow(4);
      externrefs.set(0, undefined);
      externrefs.set(offset + 0, undefined);
      externrefs.set(offset + 1, null);
      externrefs.set(offset + 2, true);
      externrefs.set(offset + 3, false);
    }

    function resolveExternrefInit(imports) {
      if (!imports || typeof imports !== "object") return undefined;

      const direct = imports.__wbindgen_init_externref_table;
      if (typeof direct === "function") return direct;

      const wbg = imports.wbg?.__wbindgen_init_externref_table;
      if (typeof wbg === "function") return wbg;

      const placeholder = imports.__wbindgen_placeholder__
        ?.__wbindgen_init_externref_table;
      if (typeof placeholder === "function") return placeholder;

      for (const value of Object.values(imports)) {
        if (!value || typeof value !== "object") continue;
        const fn = value.__wbindgen_init_externref_table;
        if (typeof fn === "function") return fn;
      }

      return undefined;
    }

    function base64decode(b64) {
      let bytes;
      if (typeof Uint8Array.fromBase64 === "function") {
        bytes = Uint8Array.fromBase64(b64);
      } else {
        const binString = atob(b64);
        const size = binString.length;
        bytes = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          bytes[i] = binString.charCodeAt(i);
        }
      }
      return ${byteExpr};
    }
    ${after}
  `;

  await wasm.withBasename(".gitignore").ensureRemove();
  await wasm.withExtname(".wasm.d.ts").ensureRemove();
  await wasm.ensureRemove();

  await dest.parent().ensureDir();
  await glueDts.writeText(glueDtsSrc);
  await glueDts.rename(destDts);
  await glue.writeText(inlined);

  await $`deno bundle -q ${
    minify ? "--minify" : ""
  } --external=debrotli --packages=bundle --output=${dest} --platform=browser --format=esm ${glue}`;

  await glue.ensureRemove();
  await outDir.ensureRemove();

  const bundled = await dest.readText();

  await dest.writeText($.dedent`
    /*!
     * Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.
     * @see https://nick.mit-license.org/2025 for the full license text.
     * @see https://github.com/nberlette/dawm for the original source.
     */
    /// <reference types="./${destDts.basename()}" />
    // deno-fmt-ignore-file
    // deno-lint-ignore-file
    // deno-coverage-ignore-file
    // @ts-nocheck -- generated file
    // @ts-self-types="./${destDts.basename()}"
    // deno-coverage-ignore-start
    ${bundled}
    // deno-coverage-ignore-stop
  `);

  log(
    `-> [${module.id}] final wasm size: ${prettyBytes(finalWasm.byteLength)}`,
    36,
  );
  log(`-> [${module.id}] wrote inline wasm + glue to ${dest}`);
  log(`-> [${module.id}] wrote type declarations to ${destDts}`);
}

function prettyBytes(
  size: number | string,
  precision = 2,
  iec = false,
  unitOverride?: string,
): string {
  const unitsSI = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const unitsIEC = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;
  size = +size;
  if (isNaN(size) || !isFinite(size)) return "NaN";
  const units = iec ? unitsIEC : unitsSI;
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

async function build() {
  await requires("rustup", "rustc", "cargo");

  if (!await $.commandExists("wasm-bindgen")) {
    await $`cargo install -f wasm-bindgen-cli`.printCommand(true);
  }

  for (const module of modules) {
    const crateManifest = $.path(module.crateDir).join("Cargo.toml");
    if (!(await crateManifest.stat())?.isFile) {
      err(`missing crate manifest: ${crateManifest}`);
    }

    log(`building wasm module: ${module.id}`, 34);
    await wasmpack(module);

    const wasm = $.path(module.outDir).join(`${module.outName}_bg.wasm`);
    if (!maybeNoOpt) {
      await wasmOpt(wasm);
    }

    await inlineWasm(module);
    log(`completed wasm module: ${module.id}`, 32);
  }
}

if (import.meta.main) await build();
