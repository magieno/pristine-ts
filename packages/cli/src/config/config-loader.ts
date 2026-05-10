import fs from "fs";
import path from "path";
import {ConfigProvenance, PristineConfig, ResolvedPristineConfig} from "./pristine-config.interface";

/**
 * File names searched for, in order. `.ts` first because every Pristine project is already a
 * TS project and the typed config gives the best DX. The .{js,mjs,cjs} variants exist for
 * non-TS projects or for users who prefer to skip the runtime TS load entirely.
 */
const CONFIG_FILE_NAMES = [
  "pristine.config.ts",
  "pristine.config.mts",
  "pristine.config.cts",
  "pristine.config.js",
  "pristine.config.mjs",
  "pristine.config.cjs",
];

/**
 * Walks up from `startDir` looking for any of the supported config file names. Stops at the
 * first match, returning the absolute path. Stops at the filesystem root without finding
 * anything → returns undefined. Walking up matters in monorepos: a CLI invoked in
 * `packages/foo/` should still find a `pristine.config.ts` at the repo root.
 */
const findConfigFile = (startDir: string): string | undefined => {
  let current = path.resolve(startDir);

  // Bound the walk: stop at the filesystem root (path.dirname of root === root).
  while (true) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

/**
 * Loads a config file from `absolutePath`. `.ts` and `.mts`/`.cts` go through `jiti`; the
 * other formats use Node's native `require()`/dynamic `import()` chain. The loader extracts
 * the default export, falling back to a named `pristineConfig` export for users who prefer
 * not to use `export default`.
 */
const importConfigFile = async (absolutePath: string): Promise<PristineConfig> => {
  const ext = path.extname(absolutePath).toLowerCase();
  let loaded: any;

  if (ext === ".ts" || ext === ".mts" || ext === ".cts") {
    // jiti is dynamic-imported (via the Function-constructor escape hatch — see
    // app-module-loader.ts) so neither tsc nor esbuild rewrites it to require().
    const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;
    const jitiModule = await dynamicImport("jiti");
    const createJiti = jitiModule.default ?? jitiModule.createJiti ?? jitiModule;
    const jiti = createJiti(absolutePath, {interopDefault: true});
    loaded = jiti(absolutePath);
  } else {
    // .js/.mjs/.cjs — let Node figure out the format. file:// URL because dynamic import
    // requires it for absolute paths on Windows and for ESM resolution.
    const dynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;
    const url = `file://${absolutePath}`;
    loaded = await dynamicImport(url);
  }

  // Accept either `export default { ... }` or `export const pristineConfig = { ... }`.
  const config = loaded?.default ?? loaded?.pristineConfig ?? loaded;

  if (!config || typeof config !== "object") {
    throw new Error(
      `[pristine] Config file at '${absolutePath}' did not export a valid configuration. ` +
      `Use \`export default defineConfig({ ... })\` or \`export const pristineConfig = { ... }\`.`
    );
  }

  return config as PristineConfig;
}

/**
 * Resolves the active Pristine config. Discovery order:
 *   1. `explicitPath` (when set, e.g. by a future `--config <path>` CLI flag) — must exist or throw.
 *   2. `pristine.config.{ts,mts,cts,js,mjs,cjs}` walking up from `startDir` (default: CWD).
 *   3. No config file at all → returns an empty config with all-`default` provenance markers.
 *
 * The returned `ResolvedPristineConfig` carries the file path (when found) and per-field
 * provenance, which `pristine config print` uses to render an annotated dump.
 */
export const loadConfig = async (options?: {explicitPath?: string; startDir?: string}): Promise<ResolvedPristineConfig> => {
  const startDir = options?.startDir ?? process.cwd();

  let configFilePath: string | undefined;
  if (options?.explicitPath !== undefined) {
    const abs = path.resolve(startDir, options.explicitPath);
    if (fs.existsSync(abs) === false) {
      throw new Error(`[pristine] Config file not found: '${options.explicitPath}' (resolved to '${abs}')`);
    }
    configFilePath = abs;
  } else {
    configFilePath = findConfigFile(startDir);
  }

  if (configFilePath === undefined) {
    return {
      config: {},
      configFilePath: undefined,
      provenance: {},
    };
  }

  const config = await importConfigFile(configFilePath);

  const provenance: Record<string, ConfigProvenance> = {};
  for (const key of Object.keys(config)) {
    provenance[key] = "config-file";
  }

  return {config, configFilePath, provenance};
}
