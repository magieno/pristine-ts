import {defineConfig} from "@pristine-ts/cli";

/**
 * Test fixture for `@pristine-ts/cli` — exercises the canonical config-file path that
 * `pristine.appModule.path` lookup, jiti loading, and command dispatch all rely on.
 */
export default defineConfig({
  appModule: {
    path: "dist/lib/cjs/app.module.js",
  },
});
