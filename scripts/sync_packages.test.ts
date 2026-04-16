import {
  assert,
  assertEquals,
  assertExists,
  assertMatch,
  assertStringIncludes,
} from "jsr:@std/assert";
import { join } from "node:path";

import { runSyncPackages } from "./sync_packages.ts";

const README_TEMPLATE = `{{generated_marker}}

# \`{{pkg.name}}\`

{{pkg.description}}

## Overview

\`{{pkg.name}}\` is a workspace package in the dawm monorepo.

- Package: \`{{pkg.name}}\`
- Directory: \`{{pkg.directory}}\`
- Homepage: {{pkg.homepage}}
- Source: {{pkg.sourceUrl}}
- Issues: {{pkg.bugs.url}}
- License: MIT

## Usage

\`\`\`ts
import * as mod from "{{pkg.name}}";

console.log(Object.keys(mod));
\`\`\`

## Entry Points

{{pkg.exports}}

## Notes

{{pkg.notes}}

## Acknowledgements

{{pkg.acknowledgements}}

## Links

- GitHub: {{pkg.footerLinks.github}}
- Issues: {{pkg.footerLinks.issues}}
- Docs: {{pkg.footerLinks.docs}}
- npm: {{pkg.footerLinks.npm}}

## Development

This README is generated from the monorepo templates via \`deno task sync:packages --apply\`.
`;

const LEGACY_README = `# \`dawm-foo\`

Generated package description.

## Package

- Package: \`dawm-foo\`
- Directory: \`packages/foo\`
- Homepage: https://github.com/nberlette/dawm/tree/main/packages/foo#readme
- Source: https://github.com/nberlette/dawm/tree/main/packages/foo/src
- Issues: https://github.com/nberlette/dawm/issues/new?title=%5Bdawm-foo%5D%20
- License: MIT

## Development

This file is generated from the monorepo templates in \`templates/\` via
\`deno task sync:packages\`.
`;

async function createFixtureRepo(
  overrides: {
    readmeMode?: "generated" | "preserve" | "custom";
    licenseMode?: "generated" | "preserve" | "custom";
    readmeText?: string;
    licenseText?: string;
  } = {},
): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: "dawm-sync-packages-test-" });
  await Deno.writeTextFile(
    join(root, "deno.json"),
    JSON.stringify({
      version: "0.1.0-test",
      author: { name: "Test User", email: "test@example.com" },
    }, null, 2),
  );
  await Deno.writeTextFile(
    join(root, "LICENSE"),
    "# The MIT License (MIT)\n\nCopyright (c) 2026 Test User.\n",
  );
  await Deno.mkdir(join(root, "templates", "packages", "{{pkg.id}}"), {
    recursive: true,
  });
  await Deno.writeTextFile(
    join(root, "templates", "packages.json"),
    JSON.stringify({
      packages: {
        foo: {
          description: "Generated package description.",
          keywords: ["dawm", "foo", "typescript"],
          readme: { mode: overrides.readmeMode ?? "generated" },
          license: { mode: overrides.licenseMode ?? "generated" },
        },
      },
    }, null, 2),
  );
  await Deno.writeTextFile(
    join(root, "templates", "packages", "{{pkg.id}}", "README.template.md"),
    README_TEMPLATE,
  );
  await Deno.writeTextFile(
    join(root, "templates", "packages", "{{pkg.id}}", "LICENSE.template"),
    "{{pkg.copyright}}\n",
  );
  await Deno.writeTextFile(
    join(root, "templates", "packages", "{{pkg.id}}", "package.template.json"),
    "{{json pkg.manifest}}\n",
  );

  const pkgDir = join(root, "packages", "foo");
  await Deno.mkdir(join(pkgDir, "src"), { recursive: true });
  await Deno.writeTextFile(
    join(pkgDir, "src", "index.ts"),
    "export const foo = 1;\n",
  );
  await Deno.writeTextFile(
    join(pkgDir, "package.json"),
    JSON.stringify({
      name: "dawm-foo",
      version: "0.0.1",
      description: "Generated package description.",
      author: { name: "Someone" },
      license: "MIT",
      type: "module",
      main: "./src/index.ts",
      module: "./src/index.ts",
      types: "./src/index.ts",
      files: ["src", "README.md", "LICENSE"],
      exports: { ".": "./src/index.ts" },
      dependencies: { "dawm-bar": "workspace:0.0.1" },
    }, null, 2) + "\n",
  );
  await Deno.writeTextFile(
    join(pkgDir, "README.md"),
    overrides.readmeText ?? LEGACY_README,
  );
  await Deno.writeTextFile(
    join(pkgDir, "LICENSE"),
    overrides.licenseText ??
      "# The MIT License (MIT)\n\nCopyright (c) 2026 Test User.\n",
  );
  return root;
}

Deno.test("sync_packages report mode does not modify files", async () => {
  const root = await createFixtureRepo();
  const before = await Deno.readTextFile(join(root, "packages", "foo", "package.json"));

  const report = await runSyncPackages(root, {});

  const after = await Deno.readTextFile(join(root, "packages", "foo", "package.json"));
  assertEquals(before, after);
  assertEquals(report.apply, false);
  assertEquals(report.backupDir, null);
  assert(report.plans.some((plan) => plan.action === "update"));
});

Deno.test("sync_packages apply mode backs up and rewrites managed files", async () => {
  const root = await createFixtureRepo();
  const report = await runSyncPackages(root, { apply: true });

  assertExists(report.backupDir);
  const backupManifest = join(report.backupDir!, "packages", "foo", "package.json");
  const backupReadme = join(report.backupDir!, "packages", "foo", "README.md");
  assertExists(await Deno.stat(backupManifest));
  assertExists(await Deno.stat(backupReadme));

  const manifest = JSON.parse(
    await Deno.readTextFile(join(root, "packages", "foo", "package.json")),
  );
  assertEquals(manifest.main, "./cjs/index.js");
  assertEquals(manifest.module, "./esm/index.js");
  assertEquals(manifest.types, "./esm/index.d.ts");
  assertEquals(manifest.exports["."].source, "./src/index.ts");
  assertEquals(manifest.exports["."].default, "./esm/index.js");
  assertEquals(manifest.exports["."].require.default, "./cjs/index.js");

  const readme = await Deno.readTextFile(join(root, "packages", "foo", "README.md"));
  assertStringIncludes(readme, "<!-- @generated by sync_packages -->");
  assertStringIncludes(readme, "## Entry Points");
});

Deno.test("sync_packages preserves custom readmes and licenses when metadata says preserve", async () => {
  const root = await createFixtureRepo({
    readmeMode: "preserve",
    licenseMode: "custom",
    readmeText: "# Custom README\n\nHandwritten.\n",
    licenseText: "Custom License\n",
  });
  const report = await runSyncPackages(root, { apply: true });

  const readme = await Deno.readTextFile(join(root, "packages", "foo", "README.md"));
  const license = await Deno.readTextFile(join(root, "packages", "foo", "LICENSE"));
  assertEquals(readme, "# Custom README\n\nHandwritten.\n");
  assertEquals(license, "Custom License\n");
  assert(report.plans.some((plan) =>
    plan.kind === "README.md" && plan.mode === "preserved"
  ));
  assert(report.plans.some((plan) =>
    plan.kind === "LICENSE" && plan.mode === "preserved"
  ));
});

Deno.test("sync_packages leaves ambiguous readmes untouched", async () => {
  const root = await createFixtureRepo({
    readmeText: "# Custom README\n\nThis is close, but not generated.\n",
  });
  const report = await runSyncPackages(root, { apply: true });

  const readme = await Deno.readTextFile(join(root, "packages", "foo", "README.md"));
  assertEquals(readme, "# Custom README\n\nThis is close, but not generated.\n");
  const readmePlan = report.plans.find((plan) => plan.kind === "README.md");
  assertExists(readmePlan);
  assertEquals(readmePlan.mode, "ambiguous");
  assertMatch(readmePlan.reason, /left untouched/);
});
