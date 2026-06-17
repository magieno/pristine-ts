/**
 * Typed configuration keys for `@pristine-ts/cli`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {CliConfigurationKeys} from "@pristine-ts/cli";
 *
 * constructor(@injectConfig(CliConfigurationKeys.InteractiveParameters) enabled: boolean) {}
 * ```
 */
export const CliConfigurationKeys = {
  /**
   * Whether the CLI may interactively ask for missing command parameters that declare a
   * `question` (via `@commandParameter`). Defaults to `true`; set it to `false` to disable
   * all such prompting (e.g. in CI). Prompting is also skipped automatically whenever the
   * input is not an interactive terminal, regardless of this value.
   */
  InteractiveParameters: "pristine.cli.interactiveParameters",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/cli`. The
 * `@pristine-ts/eslint-plugin` rule `inject-config-type-match` reads the merged map to
 * enforce parameter types on `@injectConfig` calls.
 */
export interface CliConfigurationValueMap {
  "pristine.cli.interactiveParameters": boolean;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends CliConfigurationValueMap {}
}
