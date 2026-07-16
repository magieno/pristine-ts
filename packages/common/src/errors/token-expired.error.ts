import {PristineErrorCode} from "./pristine-error-code.enum";
import {PristineErrorOptions} from "./pristine-error-options.interface";
import {UnauthorizedError} from "./unauthorized.error";

type StandardOptions = Omit<PristineErrorOptions, "httpStatus" | "exitCode" | "kind">;

/**
 * 401, `code: "TOKEN_EXPIRED"`. A refinement of {@link UnauthorizedError} for the specific
 * case where the caller *was* authenticated but their token has expired.
 *
 * This distinction is the whole point: a bare 401 tells a client "you're not
 * authenticated" but not *why*, so it can't tell "your session expired — refresh the
 * token" from "you never authenticated — send them to login". By emitting a distinct
 * `code` while keeping `httpStatus: 401`, a client can branch on the code:
 *
 * - `TOKEN_EXPIRED` → try a silent refresh, retry the request.
 * - `UNAUTHORIZED`  → the token is missing/invalid; send the user to login.
 * - `FORBIDDEN` (403) → authenticated but not permitted; don't retry, show "no access".
 *
 * Because it extends `UnauthorizedError`, `instanceof UnauthorizedError` still matches,
 * so any code that only cares about "is this a 401" keeps working.
 */
export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = "The token has expired", options: StandardOptions = {}) {
    super(message, {
      code: PristineErrorCode.TokenExpired,
      ...options,
    });
  }
}
