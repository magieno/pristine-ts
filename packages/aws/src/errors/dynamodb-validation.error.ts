import {DynamodbError} from "./dynamodb.error";

/**
 * This Error represents a Dynamodb error when there is a validation error.
 */
export class DynamodbValidationError extends DynamodbError {

  /**
   *  This Error represents a Dynamodb error when there is a validation error.
   * @param originalError The original error that was caught.
   * @param tableName The name of the DynamoDB table where the error happened.
   * @param primaryKey The primary key of the item that caused the error.
   */
  public constructor(originalError?: Error,
                     tableName?: string,
                     primaryKey?: string,
  ) {
    super(
      "Validation error in dynamodb.",
      originalError,
      tableName
    );

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DynamodbValidationError.prototype);
  }
}
