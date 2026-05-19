import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents an error when resolving in SSM.
 */
export class SSMResolverError extends PristineError {

  /**
   * This Error represents an error when resolving in SSM.
   * @param message The error message.
   * @param value The value trying to be resolved.
   * @param originalError The original error that was caught.
   */
  public constructor(message: string, value: any, originalError?: any) {
    super(message, {details: {
      value,
      type: typeof (value),
      originalError
    }});  }
}
