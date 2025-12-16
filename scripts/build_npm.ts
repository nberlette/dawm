#!/usr/bin/env -S deno run -Aq --unstable-bundle --unstable-net
// deno-lint-ignore-file no-import-prefix no-console
import { $ } from "jsr:@david/dax@0.44.1";
import * as dnt from "jsr:@deno/dnt@0.42.3";
import denoJson from "../deno.json" with { type: "json" };
import process from "node:process";

const NPM_DIR = $.path("./npm").resolve();
const SRC_DIR = $.path("./src").resolve();
const OUT_DIR = NPM_DIR.join("dist");

const outDir = OUT_DIR.toString();
await dnt.emptyDir(outDir);

const exports = Object.keys(denoJson.exports).filter((k) =>
  k !== "." && !k.includes("/global")
);

await dnt.build({
  entryPoints: [
    { kind: "export", name: ".", path: "./src/index.ts" },
    ...exports.flatMap((name) => {
      const extensions = ["", ".js"] as const;
      return extensions.map((
        ext,
      ) => ({
        kind: "export",
        name: `${name}${ext}`,
        path: `./src/${name}.ts`,
      } as const));
    }),
  ],
  outDir,
  shims: {},
  package: {
    name: "dawm",
    license: denoJson.license,
    version: denoJson.version,
    author: denoJson.author,
    main: "./cjs/index.js",
    module: "./esm/index.js",
    types: "./esm/index.d.ts",
    readme: "README.md",
    homepage: "https://github.com/nberlette/dawm#readme",
    repository: "https://github.com/nberlette/dawm",
    bugs: "https://github.com/nberlette/dawm/issues",
    keywords: [
      "dom",
      "wasm",
      "living-dom",
      "web-scraping",
      "data-extraction",
      "headless",
      "server-side",
      "dom-manipulation",
      "dom-parser",
      "tree-walking",
      "serialization",
      "selectors",
      "query-selector-all",
      "xml-parser",
      "html-parser",
      "virtual-dom",
      "rust",
    ],
    description:
      "High-performance headless DOM toolkit with an HTML/XML parser written in Rust, and DOM APIs implemented in TypeScript. Purpose-built for server-side workflows like web scraping and static site generation.",
    publishConfig: {
      access: "public",
      tag: process.env.NPM_PUBLISH_TAG || "latest",
      registry: process.env.NPM_REGISTRY_URL || "https://registry.npmjs.org/",
    },
  },
  esModule: true,
  packageManager: "npm",
  configFile: $.path("./deno.json").resolve().toFileUrl().toString(),
  test: false,
  typeCheck: false,
  async postBuild() {
    const cjsDir = OUT_DIR.join("cjs");
    const cjsWasmDir = cjsDir.join("wasm");
    const cjsWasm = cjsWasmDir.join("index.js");
    const esmDir = OUT_DIR.join("esm");
    const esmWasmDir = esmDir.join("wasm");
    const esmWasm = esmWasmDir.join("index.js");

    await SRC_DIR.parentOrThrow().join("LICENSE").copyToDir(OUT_DIR, {
      overwrite: true,
    });
    await SRC_DIR.parentOrThrow().join("README.md").copyToDir(OUT_DIR, {
      overwrite: true,
    });
    // rename the script/ directory to cjs/ for commonjs output
    await OUT_DIR.join("script").rename(cjsDir);
    // ensure any references that using /script/ are updated to /cjs/
    const packageJson = OUT_DIR.join("package.json");
    const packageText = await packageJson.readText();
    await packageJson.writeText(
      packageText.replace(
        /"import": ("\.\/esm\/(.+?)\.js"),\n(\s+)"require": "\.\/script\/\2\.js"/g,
        `"import": {\n$3  "types": "./esm/$2.d.ts",\n$3  "default": $1\n$3},\n$3"require": {\n$3  "types": "./cjs/$2.d.ts",\n$3  "default": "./cjs/$2.js"\n$3}`,
      ),
    );

    // await bundleUMD();
    void bundleUMD; // disabled for now

    async function bundleUMD() {
      const globalSrc = SRC_DIR.join("global.ts").toString();
      const outputPath = OUT_DIR.join("dawm.umd.js").toString();
      // create a global UMD (IIFE) bundle
      if (typeof Deno.bundle === "function") {
        const result = await Deno.bundle({
          entrypoints: [globalSrc],
          inlineImports: true,
          format: "iife",
          minify: true,
          packages: "bundle",
          platform: "browser",
          outputPath,
        });
        if (!result.success) {
          console.error("Failed to create UMD bundle!");
          if (result.errors.length) {
            console.error("Deno.bundle errors:", result.errors);
          }
          if (result.warnings.length) {
            console.error("Deno.bundle warnings:", result.warnings);
          }
        }
      } else {
        const result =
          await $`deno bundle -q ${globalSrc} --output=${outputPath} --format=iife --minify --platform=browser --external=debrotli --packages=bundle --vendor`
            .printCommand(true);
        if (result.code !== 0) {
          console.error("Failed to create UMD bundle!");
          console.error(result.stderr);
          process.exit(result.code);
        }
      }
      await $.path(outputPath).writeText($.dedent`
        /*!
          * dawm v${denoJson.version}
          * High-performance DOM toolkit written in Rust and TypeScript.
          * -------------------------------------------------------------------
          * Copyright (c) 2025 Nicholas Berlette. All rights reserved.
          * Licensed under the MIT License (https://nick.mit-license.org/2025).
          * -------------------------------------------------------------------
          * @see https://github.com/nberlette/dawm#readme for more information.
          */
        // deno-fmt-ignore-file
        // deno-lint-ignore-file
        /* @eslint-disable */
        // @ts-nocheck -- generated file
        ${await $.path(outputPath).readText()}
      `);
    }
  },
});
