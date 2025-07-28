import {LoggableError} from "@pristine-ts/common";

/**
 * This Error represents a Redis error.
 */
export class RedisError extends LoggableError {
  public constructor(message?: string,
                     public readonly originalError?: Error,
                     public readonly table?: string,
                     public readonly key?: string,
                     public readonly redisKey?: string,
  ) {
    super(message ?? "RedisError", {
      originalError,
      table,
      key,
      redisKey,
    });

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, RedisError.prototype);
  }
}
