import {PristineError} from "@pristine-ts/common";

/**
 * This Error is thrown when there's an error that happens while the kernel or anything is being initialized.
 */
export class KernelInitializationError extends PristineError {

  public constructor(message: string) {
    super(message);  }
}
