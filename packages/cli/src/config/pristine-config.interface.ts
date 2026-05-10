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
 *   appModule: { path: "dist/app.module.js" },
 *   build: { outDir: "dist", format: "esm" },
 * });
 * ```
 */
export interface PristineConfig {
  /**
   * Where the AppModule lives. The CLI imports this file and reads the `AppModule` named
   * export (or the export named by `export`). Path is resolved relative to the directory
   * containing the config file.
   */
  appModule?: {
    path: string;
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
