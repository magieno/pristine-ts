/**
 * The shape of `pristine.config.ts` (or `pristine.config.js`). Two top-level blocks:
 *
 *   - **`cli:`** — CLI tool–specific configuration. Where the AppModule lives, which
 *     plugins to load, build/start options. Read by `@pristine-ts/cli` before the kernel
 *     exists, since this is what tells the CLI which app to assemble.
 *   - **`config:`** — runtime configuration values keyed by
 *     `configurationDefinition.parameterName`. Read by `@pristine-ts/configuration` during
 *     kernel boot. Sits in the resolver precedence chain *above* per-key
 *     `defaultResolvers` (env vars, secrets) and *below* explicit overrides passed to
 *     `kernel.start()`.
 *
 * Authored as a `.ts` file by default; use `defineConfig()` (re-exported from
 * `@pristine-ts/cli`) for full IDE autocomplete:
 *
 * ```ts
 * import {defineConfig} from "@pristine-ts/cli";
 *
 * export default defineConfig({
 *   cli: {
 *     appModule: {
 *       sourcePath: "src/app.module.ts",
 *       outputPath: "dist/app.module.js",
 *     },
 *   },
 *   config: {
 *     "pristine.environment": "dev",
 *     "pristine.logging.consoleLoggerActivated": true,
 *   },
 * });
 * ```
 *
 * Run `pristine init` to generate this file interactively.
 */
export interface PristineConfig {
  /**
   * CLI tool–specific configuration. Tells the CLI where to find the user's AppModule,
   * which plugins to layer in, and how `pristine build` / `pristine start` should behave.
   * Read by `@pristine-ts/cli` before the kernel exists.
   */
  cli?: PristineCliConfig;

  /**
   * Runtime configuration values keyed by `configurationDefinition.parameterName`. Read
   * by `@pristine-ts/configuration` during kernel boot. A key here overrides the owning
   * module's resolver chain and `defaultValue`, but loses to explicit overrides passed
   * to `kernel.start()`.
   */
  config?: Record<string, unknown>;
}

/**
 * Inner shape of the `cli:` block. Owned by `@pristine-ts/cli`; the framework's
 * configuration system never inspects these fields.
 */
export interface PristineCliConfig {
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
}
