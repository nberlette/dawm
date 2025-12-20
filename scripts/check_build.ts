#!/usr/bin/env -S deno run -Aq

/**
 * This simple script ensures that the WebAssembly binary has been built and
 * is up-to-date with the current Rust source code. If the binary is missing or
 * has an `mtime` older than that of the `./crates/comrak-wasm/src/lib.rs`, it
 * will trigger a rebuild by running the `./build.ts` script.
 *
 * @module scripts/ensure-fresh-build
 */
// deno-lint-ignore-file

import $, { type Path } from "jsr:@david/dax@0.44.1";

const WASM_PATH = Deno.env.get("WASM_PATH") || "./src/wasm/index.js";
const RUST_PATH = Deno.env.get("RUST_PATH") || "./rs_lib/src/lib.rs";

function mtime(path: string | Path): Promise<number> {
  return $.path(path).stat().then((s) => s?.mtime?.getTime() ?? 0, () => 0);
}

async function check(): Promise<void> {
  const wasm = $.path(WASM_PATH),
    wasm_mtime = await mtime(wasm);

  const rust = $.path(RUST_PATH),
    rust_mtime = await mtime(rust);

  if (wasm_mtime && rust_mtime && wasm_mtime > rust_mtime) Deno.exit(0);

  $.logError(`Outdated or missing WebAssembly binary: ${wasm}\n`);
  await $.sleep(500);

  $.logWarn("Rebuilding now, please wait ...");

  $.logLight("  └ ℹ︎ to cancel the build, press Ctrl+C now\n");
  await $.sleep(2500); // give user a moment to cancel if they want

  const result = await $`deno task build:wasm`.printCommand(true);
  if (result.code !== 0) {
    $.logError(`failed to build WebAssembly (code ${result.code})`);
    $.logGroup(() => {
      $.logLight(`├╴ source: ${rust}\n`);
      $.logLight(`├╴ output: ${wasm}\n`);
      $.logLight(`├╴ stdout:`);
      $.logLight(`│   ${result.stdout.trim().replaceAll("\n", "\n│   ")}\n`);
      $.logLight(`└╴ stderr:`);
      $.logLight(`    ${result.stderr.trim().replaceAll("\n", "\n    ")}`);
    });
  }

  Deno.exit(result.code);
}

if (import.meta.main) check();
