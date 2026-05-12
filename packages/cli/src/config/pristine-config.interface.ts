/**
 * The shape of `pristine.config.{ts,mts,cts,js,mjs,cjs}`. All fields are optional — a project
 * with conventional layout can run `pristine` with no config at all. Provide a config when
 * you need to override a default or unlock features (plugins, custom build pipeline, etc).
 *
 * Authored as a `.ts` file by default; use `defineConfig()` (re-exported from
 * `@pristine-ts/cli`) for full IDE autocomplete:
 *
 * ```ts
 * import {defineConfig} from "@pristine-ts/cli";
 *
 * export default defineConfig({
 *   appModule: {
 *     sourcePath: "src/app.module.ts",
 *     outputPath: "dist/app.module.js",
 *   },
 * });
 * ```
 *
 * Run `pristine init` to generate this file interactively.
 */
export interface PristineConfig {
  /**
   * Where the AppModule lives. Both `sourcePath` and `outputPath` should be set when you
   * want `pristine build` to manage compilation; `outputPath` alone is enough when you
   * compile externally and just want the CLI to load the result.
   *
   * Paths are resolved relative to the directory containing the config file.
   *
   * The legacy `path` field (single field meaning "the compiled artifact") still works for
   * one minor cycle with a deprecation warning. Run `pristine init` to migrate.
   */
  appModule?: {
    /** Source TypeScript file the build should compile. Required when using `pristine build`. */
    sourcePath?: string;
    /** Compiled JavaScript file the runtime should load. Required for `pristine start`/`verify`/etc. */
    outputPath?: string;
    /** Name of the export holding the AppModule definition. Default: `AppModule`. */
    export?: string;
    /** @deprecated Use `outputPath` instead. Will be removed in a future minor release. */
    path?: string;
  };

  /** Build pipeline configuration. Used by `pristine build`. */
  build?: {
    outDir?: string;
    tsconfig?: string;
    format?: "esm" | "cjs" | "both";
    clean?: boolean;
  };

  /** Reserved for future `pristine start` features (entry path, watch mode, node args). */
  start?: {
    entry?: string;
    watch?: boolean | { paths: string[]; ignore?: string[] };
    nodeArgs?: string[];
  };

  /**
   * Extra packages whose `*Module` exports should be merged into the runtime AppModule when
   * the CLI boots. Lets tooling-only modules (e.g. a generator package) contribute commands
   * without forcing the consumer to import them into their production runtime AppModule.
   */
  plugins?: Array<string | { name: string; options?: unknown }>;

  /**
   * Default `kernel.start()` configuration values, merged on top of the CLI's defaults. Lets
   * you keep CLI-only runtime overrides out of your AppModule.
   */
  kernelConfiguration?: Record<string, unknown>;
}
