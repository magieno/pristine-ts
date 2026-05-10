/**
 * The shape of `pristine.config.{ts,js,mjs,cjs}`. All fields are optional — a project with
 * conventional layout can run `pristine` with no config at all. Provide a config when you
 * need to override a default or unlock features (plugins, custom build pipeline, etc).
 *
 * Authored as a `.ts` file by default; use `defineConfig()` (re-exported from `@pristine-ts/cli`)
 * for full IDE autocomplete:
 *
 * ```ts
 * import {defineConfig} from "@pristine-ts/cli";
 *
 * export default defineConfig({
 *   appModule: { path: "dist/app.module.js" },
 *   build: { outDir: "dist", format: "esm" },
 * });
 * ```
 */
export interface PristineConfig {
  /**
   * Where the AppModule lives. The CLI imports this file and reads the `AppModule` named export
   * (or the export named by `export`). Path is resolved relative to the directory containing the
   * config file.
   */
  appModule?: {
    /** Path to the AppModule entry. Accepts `.js`, `.mjs`, `.cjs`, `.ts`. */
    path: string;
    /** Name of the export holding the AppModule definition. Default: "AppModule". */
    export?: string;
  };

  /**
   * Build pipeline configuration. Used by `pristine build` (Phase 4+). Safe to leave unset
   * during Phase 3 — defaults are applied lazily by whichever command consumes them.
   */
  build?: {
    outDir?: string;
    tsconfig?: string;
    format?: "esm" | "cjs" | "both";
    clean?: boolean;
  };

  /**
   * Start command configuration. Used by `pristine start` (Phase 4+).
   */
  start?: {
    entry?: string;
    watch?: boolean | { paths: string[]; ignore?: string[] };
    nodeArgs?: string[];
  };

  /**
   * Extra packages whose `*Module` exports should be merged into the runtime AppModule when
   * the CLI boots. Lets tooling-only modules (e.g. a generator package) contribute commands
   * without forcing the consumer to import them into their production runtime AppModule.
   * Used in Phase 5; declared here so the schema is stable from Phase 3 forward.
   */
  plugins?: Array<string | { name: string; options?: unknown }>;

  /**
   * Default `kernel.start()` configuration values, merged on top of the CLI's defaults. Lets
   * you keep CLI-only runtime overrides out of your AppModule.
   */
  kernelConfiguration?: Record<string, unknown>;
}

/**
 * Identity helper that gives an authored `pristine.config.ts` full type checking and
 * autocomplete. Implementation is intentionally trivial — the types do all the work.
 */
export const defineConfig = (config: PristineConfig): PristineConfig => config;

/**
 * Where a resolved value originated. Used by `pristine config print` to annotate output so
 * users can tell whether a value comes from their config file, a deprecated package.json
 * field, or the CLI's built-in defaults.
 */
export type ConfigProvenance = "config-file" | "package-json-deprecated" | "default";

/**
 * A resolved `PristineConfig` augmented with discovery metadata. `loadConfig` returns this
 * shape; the raw `PristineConfig` is what users author.
 */
export interface ResolvedPristineConfig {
  config: PristineConfig;
  /** Absolute path to the config file that was loaded, if any. */
  configFilePath?: string;
  /** Per-top-level-field provenance markers, mainly for `config print`. */
  provenance: Record<string, ConfigProvenance>;
}
