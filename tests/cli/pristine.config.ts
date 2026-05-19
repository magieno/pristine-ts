import {defineConfig} from "@pristine-ts/cli";

/**
 * Test fixture for `@pristine-ts/cli` — exercises the canonical config-file path that
 * jiti loading and command dispatch rely on. Both `sourcePath` and `outputPath` are
 * required when `cli.appModule` is set, so the build manifest can fingerprint freshness.
 */
export default defineConfig({
  cli: {
    appModule: {
      sourcePath: "src/app.module.ts",
      outputPath: "dist/lib/cjs/app.module.js",
    },
  },
});
