import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents a configuration error when a validation fails.
 */
export class ConfigurationValidationError extends PristineError {
  public constructor(messages: string[]) {
    super(messages.join("\n"));  }
}
