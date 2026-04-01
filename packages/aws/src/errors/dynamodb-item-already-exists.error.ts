import {DynamodbError} from "./dynamodb.error";

/**
 * This Error is for when an item already exists in DynamoDB.
 */
export class DynamodbItemAlreadyExistsError extends DynamodbError {

  /**
   * This Error is for when an item already exists in DynamoDB.
   * @param originalError The original error that was caught.
   * @param tableName The name of the DynamoDB table where the error happened.
   * @param primaryKey The primary key of the item that caused the error.
   */
  public constructor(originalError?: Error,
                     tableName?: string,
                     primaryKey?: string,) {
    super(
      "The item already exists in dynamodb.",
      originalError,
      tableName,
    );

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DynamodbItemAlreadyExistsError.prototype);
  }
}
