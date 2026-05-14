import {PristineConfig} from "./pristine-config.interface";

/**
 * Identity helper that gives an authored `pristine.config.ts` full type checking and
 * autocomplete. Implementation is intentionally trivial — the types do all the work.
 *
 * ```ts
 * import {defineConfig} from "@pristine-ts/cli";
 *
 * export default defineConfig({
 *   appModule: { path: "dist/app.module.js" },
 * });
 * ```
 */
export const defineConfig = (config: PristineConfig): PristineConfig => config;
