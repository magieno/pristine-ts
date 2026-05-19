import {ExitCode} from "./exit-code.enum";
import {PristineError} from "./pristine.error";
import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorKind} from "./pristine-error-kind.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/** 409. Operation conflicts with existing state (duplicate, version mismatch, etc.). */
export class ConflictError extends PristineError {
  constructor(message: string, options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.Conflict, httpStatus: 409, exitCode: ExitCode.Error,
      kind: PristineErrorKind.UserError,
      ...options,
    });
  }
}
