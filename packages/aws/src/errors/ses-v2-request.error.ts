import {PristineError, PristineErrorKind} from "@pristine-ts/common";
import {AwsErrorCode} from "./aws-error-code.enum";

/**
 * SES v2 error names for which the same request can succeed later without any change.
 */
const RetryableErrorNames = [
  "TooManyRequestsException",
  "LimitExceededException",
  "ThrottlingException",
  "InternalServiceErrorException",
  "ServiceUnavailableException",
];

/**
 * This Error represents a failed request to SES v2. `awsErrorName` and `isRetryable` let the
 * caller decide between a retry and a permanent failure without parsing the AWS error.
 */
export class SesV2RequestError extends PristineError {
  /**
   * The name of the AWS error, for example `MessageRejected` or `TooManyRequestsException`.
   */
  public readonly awsErrorName?: string;

  /**
   * True when the same request can succeed later: throttling or a server-side failure.
   */
  public readonly isRetryable: boolean;

  /**
   * This Error represents a failed request to SES v2.
   * @param operation The SES v2 operation that failed, for example `SendEmail`.
   * @param originalError The original error that was caught.
   * @param details Extra details that help to debug the failure.
   */
  public constructor(public readonly operation: string,
                     originalError?: any,
                     details?: { [key in string]: any },
  ) {
    super(`There was an error with the SES v2 operation '${operation}'.`, {
      code: AwsErrorCode.SesV2RequestFailed,
      kind: PristineErrorKind.SystemError,
      cause: originalError,
      details: {operation, ...details},
    });

    this.awsErrorName = originalError?.name;
    const httpStatusCode: number | undefined = originalError?.$metadata?.httpStatusCode;
    this.isRetryable = RetryableErrorNames.includes(originalError?.name)
      || originalError?.$retryable !== undefined
      || (httpStatusCode !== undefined && httpStatusCode >= 500);
  }
}
