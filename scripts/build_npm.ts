#!/usr/bin/env -S deno run -Aq --unstable-bundle --unstable-net
// deno-lint-ignore-file no-console no-import-prefix

import * as dnt from "jsr:@deno/dnt@0.42.3";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

interface PackageJsonPerson {
  name: string;
  email?: string;
  url?: string;
}

interface PackageJsonRepository {
  type: string;
  url: string;
  directory?: string;
}

interface PackageJsonBugs {
  url?: string;
  email?: string;
}

interface ExportConditionMap {
  types?: string;
  source?: string;
  deno?: string;
  default?: string;
  require?: {
    types?: string;
    default?: string;
  };
}

interface PackageJson {
  name: string;
  version: string;
  description?: string;
  author?: string | PackageJsonPerson;
  license?: string;
  homepage?: string;
  repository?: string | PackageJsonRepository;
  bugs?: string | PackageJsonBugs;
  keywords?: string[];
  main?: string;
  module?: string;
  types?: string;
  files?: string[];
  exports?: Record<string, ExportConditionMap | string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  publishConfig?: Record<string, unknown>;
}

interface BuildConfig {
  imports?: Record<string, string>;
  nodeModulesDir?: string;
  unstable?: string[];
  compilerOptions?: Record<string, unknown>;
}

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES_DIR = join(ROOT_DIR, "packages");
const DIST_DIR = join(ROOT_DIR, "npm", "dist");

async function emptyDir(path: string): Promise<void> {
  await Deno.remove(path, { recursive: true }).catch(() => {});
  await Deno.mkdir(path, { recursive: true });
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await Deno.readTextFile(path)) as T;
}

async function listWorkspacePackages(): Promise<Array<{ dir: string; manifest: PackageJson }>> {
  const packages: Array<{ dir: string; manifest: PackageJson }> = [];
  for await (const entry of Deno.readDir(PACKAGES_DIR)) {
    if (!entry.isDirectory) continue;
    const dir = join(PACKAGES_DIR, entry.name);
    const manifestPath = join(dir, "package.json");
    try {
      const manifest = await readJson<PackageJson>(manifestPath);
      packages.push({ dir, manifest });
    } catch {
      continue;
    }
  }
  return packages.sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}

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

function resolveSourcePath(
  pkgDir: string,
  exportValue: ExportConditionMap | string,
): string {
  const source = typeof exportValue === "string"
    ? exportValue
    : exportValue.source ?? exportValue.deno ?? exportValue.default ??
      exportValue.require?.default ?? exportValue.types;
  if (!source) {
    throw new Error(`Unable to determine source entrypoint in ${pkgDir}`);
  }
  return join(pkgDir, source.replace(/^\.\//, ""));
}

function buildEntryPoints(
  pkgDir: string,
  manifest: PackageJson,
): Array<{ kind: "export"; name: string; path: string }> {
  const exports = manifest.exports ?? { ".": "./src/index.ts" };
  return Object.entries(exports)
    .sort(([left], [right]) => (left === "." ? -1 : right === "." ? 1 : left.localeCompare(right)))
    .map(([name, value]) => ({
      kind: "export" as const,
      name,
      path: resolveSourcePath(pkgDir, value),
    }));
}

async function copyTree(src: string, dest: string): Promise<void> {
  const stat = await Deno.stat(src);
  if (stat.isDirectory) {
    await Deno.mkdir(dest, { recursive: true });
    for await (const entry of Deno.readDir(src)) {
      await copyTree(join(src, entry.name), join(dest, entry.name));
    }
    return;
  }
  await Deno.mkdir(dirname(dest), { recursive: true });
  await Deno.copyFile(src, dest);
}

async function copySourceConditionFiles(
  pkgDir: string,
  outDir: string,
  manifest: PackageJson,
): Promise<void> {
  const copied = new Set<string>();
  for (const value of Object.values(manifest.exports ?? {})) {
    const source = typeof value === "string" ? value : value.source ?? value.deno;
    if (!source) continue;
    const relativeSource = source.replace(/^\.\//, "");
    if (copied.has(relativeSource)) continue;
    copied.add(relativeSource);
    const srcPath = join(pkgDir, relativeSource);
    const destPath = join(outDir, relativeSource);
    await copyTree(srcPath, destPath);
  }
  const srcDir = join(pkgDir, "src");
  try {
    const stat = await Deno.stat(srcDir);
    if (stat.isDirectory) {
      await copyTree(srcDir, join(outDir, "src"));
    }
  } catch {
    // Some packages, such as current parser wrappers, only expose root-level files.
  }
}

async function renameScriptDir(outDir: string): Promise<void> {
  const scriptDir = join(outDir, "script");
  try {
    const stat = await Deno.stat(scriptDir);
    if (!stat.isDirectory) return;
  } catch {
    return;
  }
  await Deno.rename(scriptDir, join(outDir, "cjs"));
}

async function copyPackageDocs(pkgDir: string, outDir: string): Promise<void> {
  for (const filename of ["README.md", "LICENSE"] as const) {
    const src = join(pkgDir, filename);
    try {
      const stat = await Deno.stat(src);
      if (stat.isFile) {
        await copyTree(src, join(outDir, filename));
      }
    } catch {
      continue;
    }
  }
}

async function writePackageManifest(outDir: string, manifest: PackageJson): Promise<void> {
  await Deno.writeTextFile(
    join(outDir, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

async function createBuildImportMap(
  packageName: string,
  workspaceVersions: ReadonlyMap<string, string>,
): Promise<string> {
  const imports = Object.fromEntries(
    [...workspaceVersions.entries()]
      .filter(([name]) => name !== packageName)
      .flatMap(([name, version]) => ([
        [name, `npm:${name}@${version}`],
        [`${name}/`, `npm:${name}@${version}/`],
      ])),
  );
  const importMapPath = join(
    DIST_DIR,
    `.import-map.${packageName.replaceAll("/", "_")}.json`,
  );
  await Deno.writeTextFile(
    importMapPath,
    `${JSON.stringify({ imports }, null, 2)}\n`,
  );
  return importMapPath;
}

async function createBuildConfig(packageName: string): Promise<string> {
  const rootConfig = await readJson<BuildConfig>(join(ROOT_DIR, "deno.json"));
  const buildConfig: BuildConfig = {
    imports: rootConfig.imports,
    nodeModulesDir: rootConfig.nodeModulesDir,
    unstable: rootConfig.unstable,
    compilerOptions: rootConfig.compilerOptions,
  };
  const configPath = join(
    DIST_DIR,
    `.deno.${packageName.replaceAll("/", "_")}.json`,
  );
  await Deno.writeTextFile(configPath, `${JSON.stringify(buildConfig, null, 2)}\n`);
  return configPath;
}

function normalizeDependencyVersions(
  versions: Record<string, string> | undefined,
  workspaceVersions: ReadonlyMap<string, string>,
): Record<string, string> | undefined {
  if (!versions) return undefined;
  const normalized = Object.fromEntries(
    Object.entries(versions).map(([name, version]) => {
      if (!version.startsWith("workspace:")) {
        return [name, version];
      }
      const workspaceVersion = workspaceVersions.get(name);
      if (!workspaceVersion) {
        throw new Error(`Unable to resolve workspace dependency version for ${name}`);
      }
      const suffix = version.slice("workspace:".length);
      if (!suffix || suffix === "*") {
        return [name, workspaceVersion];
      }
      if (suffix === "^" || suffix === "~") {
        return [name, `${suffix}${workspaceVersion}`];
      }
      return [name, suffix];
    }),
  );
  return normalized;
}

function getPublishManifest(
  manifest: PackageJson,
  workspaceVersions: ReadonlyMap<string, string>,
): PackageJson {
  return {
    ...manifest,
    files: manifest.files ?? ["src", "esm", "cjs", "README.md", "LICENSE"],
    dependencies: normalizeDependencyVersions(manifest.dependencies, workspaceVersions),
    peerDependencies: normalizeDependencyVersions(
      manifest.peerDependencies,
      workspaceVersions,
    ),
  };
}

async function validateBuiltExports(outDir: string, manifest: PackageJson): Promise<void> {
  const paths = new Set<string>();
  paths.add(manifest.main ?? "./cjs/index.js");
  paths.add(manifest.module ?? "./esm/index.js");
  paths.add(manifest.types ?? "./esm/index.d.ts");

  for (const value of Object.values(manifest.exports ?? {})) {
    if (typeof value === "string") {
      paths.add(value);
      continue;
    }
    if (value.types) paths.add(value.types);
    if (value.source) paths.add(value.source);
    if (value.deno) paths.add(value.deno);
    if (value.default) paths.add(value.default);
    if (value.require?.types) paths.add(value.require.types);
    if (value.require?.default) paths.add(value.require.default);
  }

  const missing: string[] = [];
  for (const relativePath of paths) {
    const fullPath = join(outDir, relativePath.replace(/^\.\//, ""));
    try {
      await Deno.stat(fullPath);
    } catch {
      missing.push(relativePath);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing built export targets for ${manifest.name}:\n${missing.map((path) => ` - ${path}`).join("\n")}`,
    );
  }
}

async function buildPackageToDist(
  pkgDir: string,
  manifest: PackageJson,
  publishManifest: PackageJson,
  workspaceVersions: ReadonlyMap<string, string>,
): Promise<void> {
  const outDir = join(DIST_DIR, manifest.name);
  await emptyDir(outDir);
  const importMapPath = await createBuildImportMap(
    manifest.name,
    workspaceVersions,
  );
  const buildConfigPath = await createBuildConfig(manifest.name);

  try {
    await dnt.build({
      entryPoints: buildEntryPoints(pkgDir, manifest),
      outDir,
      shims: {},
      package: {
        name: publishManifest.name,
        version: publishManifest.version,
        description: publishManifest.description,
        license: publishManifest.license,
        author: publishManifest.author,
        main: publishManifest.main,
        module: publishManifest.module,
        types: publishManifest.types,
        readme: "README.md",
        homepage: publishManifest.homepage,
        repository: publishManifest.repository,
        bugs: publishManifest.bugs,
        keywords: publishManifest.keywords,
        publishConfig: publishManifest.publishConfig,
        dependencies: publishManifest.dependencies,
        peerDependencies: publishManifest.peerDependencies,
      },
      esModule: true,
      packageManager: "npm",
      configFile: pathToFileURL(buildConfigPath).toString(),
      importMap: pathToFileURL(importMapPath).toString(),
      test: false,
      typeCheck: false,
      skipSourceOutput: true,
      skipNpmInstall: true,
      declaration: "inline",
      declarationMap: false,
      compilerOptions: {
        target: "ES2022",
        skipLibCheck: true,
      },
      async postBuild() {
        await renameScriptDir(outDir);
        await copySourceConditionFiles(pkgDir, outDir, publishManifest);
        await copyPackageDocs(pkgDir, outDir);
        await writePackageManifest(outDir, publishManifest);
        await validateBuiltExports(outDir, publishManifest);
      },
    });
  } finally {
    await Deno.remove(buildConfigPath).catch(() => {});
    await Deno.remove(importMapPath).catch(() => {});
  }
}

async function main(): Promise<void> {
  const { selectedPackages } = parseArgs(Deno.args);
  await emptyDir(DIST_DIR);
  const packages = await listWorkspacePackages();
  const workspaceVersions = new Map(
    packages.map(({ manifest }) => [manifest.name, manifest.version] as const),
  );
  const filteredPackages = selectedPackages.size === 0
    ? packages
    : packages.filter(({ manifest }) => selectedPackages.has(manifest.name));

  if (selectedPackages.size > 0 && filteredPackages.length !== selectedPackages.size) {
    const known = new Set(filteredPackages.map(({ manifest }) => manifest.name));
    const missing = [...selectedPackages].filter((name) => !known.has(name));
    throw new Error(`Unknown workspace package(s): ${missing.join(", ")}`);
  }

  for (const { dir, manifest } of filteredPackages) {
    const publishManifest = getPublishManifest(manifest, workspaceVersions);
    console.log(`Building ${manifest.name} -> npm/dist/${manifest.name}`);
    await buildPackageToDist(dir, manifest, publishManifest, workspaceVersions);
  }
}

if (import.meta.main) {
  await main();
}
