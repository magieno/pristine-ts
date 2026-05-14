/**
 * The shape of `pristine.config.ts` (or `pristine.config.js`). The `appModule` block is
 * the canonical (and only) way to tell the CLI where your AppModule lives. When that
 * block is present, both `sourcePath` and `outputPath` must be provided so the build
 * manifest can keep them in sync.
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
   * Where the AppModule lives. Both `sourcePath` and `outputPath` are required when
   * `appModule` is set. Paths are resolved relative to the directory containing the
   * config file.
   */
  appModule?: {
    /** Source TypeScript file the build compiles. */
    sourcePath: string;
    /** Compiled JavaScript file the runtime loads. */
    outputPath: string;
    /** Name of the export holding the AppModule definition. Default: `AppModule`. */
    export?: string;
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
