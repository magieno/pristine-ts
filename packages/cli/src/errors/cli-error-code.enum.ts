/**
 * Error-code catalog owned by `@pristine-ts/cli`. Surfaced via `PristineErrorOptions.code`
 * (typed `PristineErrorCode | string`, so any enum value is accepted).
 *
 * Codes here describe CLI-specific failures — command resolution, argument mapping,
 * and argument validation.
 */
export enum CliErrorCode {
  CommandNotFound          = "COMMAND_NOT_FOUND",
  ArgumentMappingFailed    = "ARGUMENT_MAPPING_FAILED",
  ArgumentValidationFailed = "ARGUMENT_VALIDATION_FAILED",
}
