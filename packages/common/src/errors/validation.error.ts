import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 422. Input parsed but failed semantic validation. CLI exit `ExitCode.DataError` (65). */
export class ValidationError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.ValidationFailed, httpStatus: 422, exitCode: ExitCode.DataError,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
