/**
 * This Error represents a LoggableError
 */
export class LoggableError extends Error {
  public constructor(readonly message: string, readonly extra?: any) {
    super(message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, LoggableError.prototype);
  }
}
