import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 403. Caller is authenticated but lacks permission. CLI exit `ExitCode.NoPermission` (77). */
export class ForbiddenError extends PristineError {
  constructor(message: string = "Forbidden", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Forbidden, httpStatus: 403, exitCode: ExitCode.NoPermission,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
