import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 401. Caller is not authenticated. CLI exit `ExitCode.NoPermission` (77). */
export class UnauthorizedError extends PristineError {
  constructor(message: string = "Unauthorized", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Unauthorized, httpStatus: 401, exitCode: ExitCode.NoPermission,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
