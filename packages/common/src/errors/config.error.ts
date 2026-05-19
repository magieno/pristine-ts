import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/**
 * Configuration loading / parsing / validation failure. No `httpStatus` — config errors
 * shouldn't be exposed to HTTP callers, so the responder will treat them as 500 with
 * sanitized message. CLI exit `ExitCode.Configuration` (78). Marked `SystemError` so the
 * message isn't surfaced verbatim in production HTTP responses.
 */
export class ConfigError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.ConfigError, exitCode: ExitCode.Configuration,
      kind: PristineErrorKind.SystemError,
      ...options,
    });
  }
}
