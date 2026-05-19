import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents a Redis error.
 */
export class RedisError extends PristineError {
  public constructor(message?: string,
                     public readonly originalError?: Error,
                     public readonly table?: string,
                     public readonly key?: string,
                     public readonly redisKey?: string,
  ) {
    super(message ?? "RedisError", {details: {
      originalError,
      table,
      key,
      redisKey,
    }});  }
}
