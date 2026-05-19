import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/**
 * CLI-only — bad command-line usage (wrong flag, missing required arg, unknown command).
 * No `httpStatus`. CLI exit `ExitCode.Usage` (64).
 */
export class UsageError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.UsageError, exitCode: ExitCode.Usage,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
