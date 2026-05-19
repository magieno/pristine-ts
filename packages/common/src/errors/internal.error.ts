import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/**
 * Catch-all for framework/system bugs that shouldn't be exposed verbatim. 500.
 * CLI exit `ExitCode.Software` (70). `SystemError` triggers message sanitization in
 * production mode.
 */
export class InternalError extends PristineError {
  constructor(message: string = "Internal error", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.InternalError, httpStatus: 500, exitCode: ExitCode.Software,
      kind: PristineErrorKind.SystemError,
      ...options,
    });
  }
}
