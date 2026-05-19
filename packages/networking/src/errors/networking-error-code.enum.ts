/**
 * Error-code catalog owned by `@pristine-ts/networking`. Surfaced via
 * `PristineErrorOptions.code` (typed `PristineErrorCode | string`, so any enum value is
 * accepted).
 *
 * Codes here describe HTTP-layer failures specific to the networking module — body
 * parsing/validation, request mapping, etc.
 */
export enum NetworkingErrorCode {
  InvalidBody = "INVALID_BODY",
}
