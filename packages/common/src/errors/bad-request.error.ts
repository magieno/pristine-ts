import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 400. Caller sent malformed/invalid input. CLI exit `ExitCode.DataError` (65). */
export class BadRequestError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.BadRequest, httpStatus: 400, exitCode: ExitCode.DataError,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
