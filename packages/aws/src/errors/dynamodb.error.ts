import {PristineError} from "@pristine-ts/common";

/**
 * This Error is the base class for DynamoDB errors.
 */
export class DynamodbError extends PristineError {
  /**
   * This Error is the base class for DynamoDB errors.
   * @param message The message of the error.
   * @param originalError The original error that was caught.
   * @param tableName The name of the DynamoDB table where the error happened.
   * @param primaryKey The primary key of the item that caused the error.
   */
  public constructor(message?: string,
                     public readonly originalError?: Error,
                     public readonly tableName?: string,
                     public readonly primaryKey?: string,
  ) {
    super(message ?? "DynamoDBError", {details: {
      originalError,
      tableName,
      primaryKey,
    }});  }
}
