/**
 * Error-code catalog owned by `@pristine-ts/cli`. Surfaced via `PristineErrorOptions.code`
 * (typed `PristineErrorCode | string`, so any enum value is accepted).
 *
 * Codes here describe CLI-specific failures — command resolution, argument mapping,
 * argument validation, and command-parameter binding.
 */
export enum CliErrorCode {
  CommandNotFound          = "COMMAND_NOT_FOUND",
  ArgumentMappingFailed    = "ARGUMENT_MAPPING_FAILED",
  ArgumentValidationFailed = "ARGUMENT_VALIDATION_FAILED",

  /**
   * Two `@commandParameter` properties on the same options class resolve to the same flag.
   * A programming error in the command's options definition, not bad user input.
   */
  CommandParameterFlagConflict = "COMMAND_PARAMETER_FLAG_CONFLICT",

  /**
   * The user cancelled an interactive prompt with `Ctrl+C`. Carried by
   * `PromptCancelledError` — a clean, user-initiated cancellation, not a failure.
   */
  PromptCancelled = "PROMPT_CANCELLED",
}
