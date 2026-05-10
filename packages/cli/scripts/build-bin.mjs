#!/usr/bin/env node
// Bundles src/bin.ts into a single self-contained CJS file at dist/bin/pristine.cjs.
// Inlines @pristine-ts/* (so the bin runs from anywhere without depending on its install
// location's node_modules) and keeps decorator/metadata libs external (single-instance
// requirement for tsyringe + reflect-metadata).

import {build} from "esbuild";
import {chmod, mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import {readFileSync} from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const outFile = resolve(packageRoot, "dist/bin/pristine.cjs");

const pkg = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"));

// Externals: anything we cannot safely have two copies of in a single Node process. tsyringe
// holds the DI registry; reflect-metadata is the polyfill backing every decorator; both must
// be the exact same instance the consumer's code is using when it boots.
const externals = [
  "tsyringe",
  "reflect-metadata",
  "class-transformer",
];

await mkdir(dirname(outFile), {recursive: true});

// Entry is the tsc-compiled JS, not the TS source. esbuild does not emit TypeScript's
// `design:paramtypes` decorator metadata (the team has rejected this feature), so bundling
// directly from .ts loses the runtime metadata that tsyringe needs for constructor injection.
// The pre-compiled CJS already has the `__decorate` + `Reflect.metadata` calls baked in
// by tsc — bundling from those preserves them.
const entryPoint = resolve(packageRoot, "dist/lib/cjs/bin.js");

await build({
  entryPoints: [entryPoint],
  outfile: outFile,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  external: externals,
  sourcemap: "inline",
  // Keep names so stack traces and tsyringe's class-name-based registration both work.
  keepNames: true,
  logLevel: "info",
  metafile: false,
  legalComments: "none",
});

await chmod(outFile, 0o755);

console.log(`pristine bin built: ${outFile} (v${pkg.version})`);
