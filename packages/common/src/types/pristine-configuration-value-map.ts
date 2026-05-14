/**
 * Ambient interface that every `@pristine-ts/*` package extends with its own configuration
 * keys via TypeScript declaration merging. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads this map to verify that `@injectConfig` parameter
 * types match the declared value type for each key.
 *
 * Apps can extend it with their own keys by adding a `declare module` block in their
 * own code:
 *
 * ```ts
 * declare module "@pristine-ts/common" {
 *   interface PristineConfigurationValueMap {
 *     "my-app.feature-flag": boolean;
 *     "my-app.api-key": string;
 *   }
 * }
 * ```
 *
 * Once augmented, the lint rule will verify that any `@injectConfig("my-app.feature-flag")`
 * binds to a parameter typed `boolean`.
 */
export interface PristineConfigurationValueMap {}
