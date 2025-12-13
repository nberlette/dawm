#!/usr/bin/env -S deno run -Aq

/*!
 * Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.
 *
 * File adapted from https://deno.land/x/brotli@v0.1.4/scripts/build.ts
 */
// deno-lint-ignore-file no-import-prefix no-unused-vars
import zlib, { constants } from "node:zlib";
import path from "node:path";

import { $ } from "jsr:@david/dax@0.44.1";

const name = "dawm";

const outDir = "lib";
const brotliJs = "debrotli.bundle.js";
const brotliFile = path.join(outDir, brotliJs);

function compress(data: Uint8Array, quality = 11): Uint8Array {
  const { buffer } = zlib.brotliCompressSync(data, {
    params: {
      // we don't use text mode since we're not compressing text
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
      [constants.BROTLI_PARAM_QUALITY]: quality,
      [constants.BROTLI_PARAM_LGWIN]: 22,
    },
  });
  // return a native Uint8Array, not a node Buffer
  return new Uint8Array(buffer);
}

async function requires(...executables: string[]) {
  const where = Deno.build.os === "windows" ? "where" : "which";

  for (const executable of executables) {
    const p = new Deno.Command(where, {
      args: [executable],
      stderr: "null",
      stdin: "null",
      stdout: "null",
    }).spawn();

    if (!(await p.status).success) {
      err(`Could not find required build tool ${executable}`);
    }
  }
}

async function run(msg: string, cmd: string, ...args: string[]) {
  log(msg);

  const p = new Deno.Command(cmd, {
    args,
    stderr: "inherit",
    stdin: "null",
    stdout: "inherit",
    env: {
      ...Deno.env.toObject(),
      WASM_OPT_LEVEL: Deno.env.get("WASM_OPT_LEVEL") ?? "z",
      WASM_OPT_BULK_MEMORY: Deno.env.get("WASM_OPT_BULK_MEMORY") ?? "1",
      WASM_OPT_EXTRA_ARGS: Deno.env.get("WASM_OPT_EXTRA_ARGS") ?? "",
    },
  }).spawn();

  if (!(await p.status).success) {
    err(`${msg} failed`);
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
  return Deno.exit(1);
}

function warn(...text: string[]): void {
  log(text.join(" "), "33", "warn");
}

async function get_decompressor() {
  log("downloading npm:debrotli wasm");
  // fetching from esm.sh since it's easier than bundling it ourselves.
  // the debrotli package is a ~250KB inline brotli decompressor (WASM).
  // its very fast and has a small footprint.
  const brotli = await fetch(
    "https://esm.sh/debrotli/es2022/lib/brotli.bundle.mjs?minify&bundle",
  ).then((r) => r.text());

  log(`writing brotli decompressor to "${brotliFile}"`);
  await Deno.writeTextFile(
    brotliFile,
    $.dedent`
    // deno-lint-ignore-file
    // deno-fmt-ignore-file
    // @ts-nocheck -- generated
    ${brotli}
  `,
  );
}

async function build(...args: string[]) {
  await requires("rustup", "rustc", "cargo");

  if (!(await Deno.stat("Cargo.toml")).isFile) {
    err(`the build script should be executed in the "${name}" root`);
  }

  await run(
    "building using @deno/wasmbuild",
    "deno",
    "run",
    "-Aq",
    "--env-file=.env", // + import.meta.resolve("../.env").replace(/^file:\/\//, ""),
    "jsr:@deno/wasmbuild@0.19.2",
    "--inline",
    "--out",
    outDir,
  );

  const generated = await Array.fromAsync(
    Deno.readDir(outDir),
    ({ name }) => `${outDir}/${name}`,
  );

  const [maybePath] = args;
  const path = maybePath ||
    generated.find((p) => p.endsWith(".js") && !p.endsWith(".internal.js"));

  if (!path || !(await Deno.stat(path))) {
    err(
      `could not find file "${path}" in "${outDir}".\n\n` +
        `Generated files available:\n\n - ${generated.join("\n - ")}\n`,
    );
  }

  const src = await Deno.readTextFile(path);

  // remove internal exports from the public API
  // (theres no reason to expose all of the `__wbg_*` stuff to the user)
  let out = rewrite_exports(src, path);

  // compress the inline wasm module using brotli
  // (unless the user has opted out by setting BROTLI=0 or --no-brotli)
  if (Deno.env.get("BROTLI") !== "0" && !args.includes("--no-brotli")) {
    out = await compress_wasm(out, path);
    // write brotli decompressor to disk
    await get_decompressor();

    const srcLen = src.length, outLen = out.length;
    const reduction = ((srcLen - outLen) / srcLen * 100).toFixed(2);
    log(
      `\n✔︎ compressed wasm from \x1b[91m${pretty_bytes(srcLen)}\x1b[39m to ` +
        `\x1b[1;4;92m${pretty_bytes(outLen)}\x1b[0m, a reduction of ` +
        `\x1b[1;93m${reduction}%\x1b[0m\n`,
    );
    await Deno.writeTextFile(path, out);
  } else {
    warn(
      "⚠︎ skipping wasm compression.\n",
      "note: the inline wasm may be large. to enable compression, set environment variable BROTLI=<1-11>" +
        (args.includes("--no-brotli")
          ? " and remove any --no-brotli flags as well."
          : "."),
    );

    await Deno.writeTextFile(path, out);
    log(
      `\n✔︎ wrote wasm to \x1b[1;4;92m${path}\x1b[0m \x1b[2m(${
        pretty_bytes(out.length)
      })\x1b[0m\n`,
    );
  }
}

function rewrite_exports(src: string, path: string | URL): string {
  // remove internal exports from the public API
  // (theres no reason to expose all of the `__wbg_*` stuff to the user)
  return src.replace(
    /^\s*export\s+\*\s+from\s+(["'])(\S+?\.internal\.m?js)\1;?\s*$/gm,
    (_, q, p) => {
      const internal = Deno.readTextFileSync(
        path.toString().replace(/(?<=\/)[^/]+$/, p).replace(/\/\.\//g, "/"),
      );
      const re =
        /export\s+(?:const|function|class)\s+((?!_)[^\s(={]+?)\s*(?:[(={])/g;
      const exports = new Set<string>();
      for (const m of internal.matchAll(re)) exports.add(m[1]);
      return $.dedent`
        export {
          ${[...exports].join(",\n  ")},
        } from ${q}${p}${q};
      `;
    },
  );
}

/**
 * Decodes, compresses, and re-encodes the inline wasm module in the js file.
 * This reduces the size of the module by up to 80% (e.g. ~1.2M to ~250K).
 */
function compress_wasm(src: string, path: string | URL): string {
  return src.replace(
    /const bytes = base64decode\("(.+?)"\);\s*?\n/s,
    (_, b) => {
      // `import { decompress } from "npm:brocha@^0.1.1";\n\n` +
      // we use `import()` to conditionally load the native module,
      // if its available, otherwise we fallback to a pure JS implementation
      // of the brotli decompression algorithm. this is to ensure that we
      // take advantage of the native module (and its performance benefits)
      // if available, without losing compatibility with other runtimes.
      // return $.dedent`
      //   /** @type {(b: Uint8Array) => Uint8Array} */
      //   const decompress = await import("node:zlib" + "").then(
      //     // use node zlib if available, e.g. in node, deno, and bun
      //     (z) => (z.default ?? z)["brotliDecompressSync"].bind(z),
      //     // otherwise use a bundled debrotli, a fast wasm brotli decompressor
      //     () => import("./${brotliJs}").then((m) => m.decompress || m.default)
      //   );
      return $.dedent`
        import { decompress } from "./${brotliJs}";

        const bytes = decompress(
          base64decode("${"\\\n"}${
        btoa(
          compress(
            Uint8Array.from(
              atob(b.replaceAll(/\\|\s+/g, "")),
              (c) => c.charCodeAt(0),
            ),
          ).reduce((a, b) => a + String.fromCharCode(b), ""),
        ).replace(/.{77}/g, "$&\\\n")
      }${"\\\n"}")
        );
      `;
    },
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

if (import.meta.main) await build(...Deno.args);
