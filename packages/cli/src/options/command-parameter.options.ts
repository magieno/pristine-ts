import {CommandParameterChoices} from "../types/command-parameter-choices.type";

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

  /**
   * Marks the value as a secret (password, token, connection string with credentials, …).
   * When asked for interactively, the input is masked rather than echoed, and the answer is
   * never trimmed or printed back in any re-ask/validation feedback.
   */
  sensitive?: boolean;

  /**
   * The set of allowed values for this parameter (single-select). When present and the value is
   * asked for interactively, the CLI shows an arrow-key menu instead of a free-text prompt.
   *
   * Three shapes:
   *   - a **static** list — `["dev", "staging", "prod"]` or `[{name, value}, …]`;
   *   - a **resolver function** — `(ctx) => […]` (sync or async), for values computed at prompt
   *     time with no framework services;
   *   - a **provider class** — a `CommandParameterChoicesProviderInterface` constructor, resolved
   *     from DI so it can inject services (e.g. list files, query an API).
   *
   * Dynamic choices (function / provider) drive the interactive menu only; a value passed as a
   * flag is taken as-is (the resolver isn't run off the prompt path). Pair with `@IsIn(...)` if a
   * dynamic value must also be validated when supplied non-interactively. A *static* list is not
   * itself a validator — add `@IsIn(...)` / `@IsEnum(...)` to enforce it everywhere.
   */
  choices?: CommandParameterChoices;

  /**
   * The placeholder shown for this parameter in the generated `Usage:` line — e.g. `key-or-file`
   * renders `[--pubkey=<key-or-file>]`. Defaults to the property name.
   */
  valueHint?: string;

  /**
   * Overrides the *entire* message shown when a supplied value fails validation — used verbatim,
   * with `%value%` and `%flag%` placeholders substituted (the value is `<hidden>` for a
   * `sensitive` parameter). When omitted, the message is generated as
   * `Invalid <flag> '<value>'. <validator message>`.
   */
  errorMessage?: string;
}
