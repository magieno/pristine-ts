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

  /**
   * Explicit program name shown in generated `Usage:` lines (e.g. `myapp`). Optional: when unset,
   * the CLI derives the name from `argv[1]`, falling back to `pristine`. Set it for launch shapes
   * where `argv[1]` isn't the friendly name (e.g. `node dist/bin/cli.cjs`).
   */
  BinName: "pristine.cli.binName",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/cli`. The
 * `@pristine-ts/eslint-plugin` rule `inject-config-type-match` reads the merged map to
 * enforce parameter types on `@injectConfig` calls.
 */
export interface CliConfigurationValueMap {
  "pristine.cli.interactiveParameters": boolean;
  "pristine.cli.binName": string;
}

declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends CliConfigurationValueMap {}
}
