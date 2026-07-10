import {BadRequestError} from "@pristine-ts/common";

/**
 * Thrown when a cron expression cannot be parsed or is semantically invalid.
 *
 * It extends {@link BadRequestError} so that, if it propagates to an HTTP boundary (for
 * example a controller that validates a user-submitted schedule), the framework's HTTP
 * responder surfaces it as a **400 Bad Request** automatically. The `message` is written
 * to be safe and precise enough to return verbatim to the caller, and the offending
 * `expression` (plus optional field context) is carried in the error `details` bag.
 */
export class InvalidCronExpressionError extends BadRequestError {
  /**
   * @param message A precise, caller-safe description of what is wrong with the expression.
   * @param expression The raw cron expression that failed to parse.
   * @param field The name of the offending field (e.g. `"minute"`), when known.
   */
  public constructor(
    message: string,
    public readonly expression: string,
    public readonly field?: string,
  ) {
    super(message, {
      code: "INVALID_CRON_EXPRESSION",
      details: {expression, ...(field !== undefined ? {field} : {})},
    });
  }
}
