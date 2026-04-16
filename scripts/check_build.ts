#!/usr/bin/env -S deno run -Aq

// deno-lint-ignore-file
import $, { type Path } from "jsr:@david/dax@0.45.0";

const WASM_OUTPUTS = [
  "./packages/core/src/parser.ts",
  "./packages/dawm-css-parser/index.js",
];

const RUST_ROOTS = Deno.env.get("RUST_PATH")
  ? [Deno.env.get("RUST_PATH")!]
  : ["./packages/core/wasm", "./packages/dawm-css-parser"];

function mtime(path: string | Path): Promise<number> {
  return $.path(path).stat().then((s) => s?.mtime?.getTime() ?? 0, () => 0);
}

async function newestRustMtime(root: string): Promise<number> {
  let newest = 0;

  async function walk(dir: string) {
    for await (const entry of Deno.readDir(dir)) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(full);
        continue;
      }

      if (
        entry.isFile &&
        (entry.name.endsWith(".rs") || entry.name === "Cargo.toml")
      ) {
        newest = Math.max(newest, await mtime(full));
      }
    }
  }

  await walk(root);
  return newest;
}

async function check(): Promise<void> {
  let rustMtime = 0;
  for (const root of RUST_ROOTS) {
    rustMtime = Math.max(rustMtime, await newestRustMtime(root));
  }
  if (!rustMtime) {
    $.logError(
      `could not determine rust source mtime under ${RUST_ROOTS.join(", ")}`,
    );
    Deno.exit(1);
  }

  let oldestWasmMtime = Number.POSITIVE_INFINITY;
  let missingOutput: string | null = null;

  for (const output of WASM_OUTPUTS) {
    const outMtime = await mtime(output);
    if (!outMtime) {
      missingOutput = output;
      break;
    }
    oldestWasmMtime = Math.min(oldestWasmMtime, outMtime);
  }

  if (!missingOutput && oldestWasmMtime > rustMtime) {
    Deno.exit(0);
  }

  if (missingOutput) {
    $.logError(`Missing WebAssembly output: ${missingOutput}`);
  } else {
    $.logError("Outdated WebAssembly outputs detected.");
  }

  await $.sleep(500);
  $.logWarn("Rebuilding now, please wait ...");
  $.logLight("  └ ℹ︎ to cancel the build, press Ctrl+C now\n");
  await $.sleep(2500);

  const result = await $`deno task build:wasm`.printCommand(true);
  if (result.code !== 0) {
    $.logError(`failed to build WebAssembly (code ${result.code})`);
    $.logGroup(() => {
      $.logLight(`├╴ source roots:`);
      $.logLight(`│   ${RUST_ROOTS.join("\n│   ")}\n`);
      $.logLight(`├╴ outputs:`);
      for (const output of WASM_OUTPUTS) $.logLight(`│   ${output}`);
      $.logLight(`├╴ stdout:`);
      $.logLight(`│   ${result.stdout.trim().replaceAll("\n", "\n│   ")}\n`);
      $.logLight(`└╴ stderr:`);
      $.logLight(`    ${result.stderr.trim().replaceAll("\n", "\n    ")}`);
    });
  }

  Deno.exit(result.code);
}

if (import.meta.main) check();
