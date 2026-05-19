import {PristineError} from "@pristine-ts/common";

/**
 * This error is a generic error thrown when the kernel is running and you need a generic error.
 */
export class RuntimeError extends PristineError {
  public constructor(readonly message: string) {
    super(message);  }
}
