import {injectConfigTypeMatch} from "./rules/inject-config-type-match";

/**
 * The `@pristine-ts/eslint-plugin` plugin entry point.
 *
 * Usage in `.eslintrc.cjs`:
 *
 * ```js
 * module.exports = {
 *   parser: "@typescript-eslint/parser",
 *   parserOptions: {
 *     project: "./tsconfig.json",
 *   },
 *   plugins: ["@pristine-ts"],
 *   rules: {
 *     "@pristine-ts/inject-config-type-match": "error",
 *   },
 * };
 * ```
 *
 * Or via the recommended config:
 *
 * ```js
 * extends: ["plugin:@pristine-ts/recommended"],
 * ```
 */
export const rules = {
  "inject-config-type-match": injectConfigTypeMatch,
};

export const configs = {
  recommended: {
    plugins: ["@pristine-ts"],
    rules: {
      "@pristine-ts/inject-config-type-match": "error",
    },
  },
};

// Default export so consumers can do `import pristinePlugin from "@pristine-ts/eslint-plugin"`
// AND so the CJS interop produces the conventional `module.exports = { rules, configs }`
// that ESLint's plugin loader expects.
export default {rules, configs};
