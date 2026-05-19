import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 404. Resource doesn't exist. CLI exit `ExitCode.Error` (1). */
export class NotFoundError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.NotFound, httpStatus: 404, exitCode: ExitCode.Error,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
