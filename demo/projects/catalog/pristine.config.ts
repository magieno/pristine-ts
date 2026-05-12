import {defineConfig} from "@pristine-ts/cli";

/**
 * Pristine CLI configuration for the catalog demo. Mirrors what `pristine init` would
 * generate for a greenfield project — but with the matching tsconfig already in place so
 * `pristine build` produces output exactly at the configured `outputPath`.
 *
 * The HTTP server defaults to 0.0.0.0:3000. Override per-environment via env vars
 * (`PRISTINE_HTTP_KERNEL_SERVER_PORT`, `PRISTINE_HTTP_KERNEL_SERVER_ADDRESS`) or on
 * the CLI: `pristine start --port=4000 --address=127.0.0.1`. We deliberately don't
 * override here so the demo's pristine.config.ts stays minimal — the Configuration
 * chapter shows how to add overrides.
 */
export default defineConfig({
  appModule: {
    sourcePath: "src/app.module.ts",
    outputPath: "dist/app.module.js",
  },
  build: {
    tsconfig: "tsconfig.json",
    format: "esm",
  },
});
