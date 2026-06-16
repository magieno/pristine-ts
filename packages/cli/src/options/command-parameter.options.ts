/**
 * Options accepted by the `@commandParameter` decorator. Every field is optional: an empty
 * `@commandParameter()` is valid and simply marks the property as a known command-line
 * parameter, while individual fields opt into extra behavior.
 */
export interface CommandParameterOptions {
  /**
   * The command-line flag this property binds to. Defaults to the property name.
   *
   * Arguments are bound to options by property name, so without an override the property
   * must be named exactly like the flag. Set this to let the property name and the flag
   * differ (e.g. a camelCase property bound to a dash-separated flag).
   */
  flag?: string;

  /**
   * The question to ask interactively when this parameter is absent from the command line.
   *
   * When set — and interactive parameters are enabled (see `CliConfigurationKeys`) and the
   * input is an interactive terminal — the CLI asks this question and uses the answer.
   * When omitted, the parameter is never asked for; a missing value is left to validation.
   */
  question?: string;
}
