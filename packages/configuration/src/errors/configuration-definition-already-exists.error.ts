import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents a configuration error when a configuration definition already exists.
 */
export class ConfigurationDefinitionAlreadyExistsError extends PristineError {
  public constructor(message: string, parameterName: string) {
    super(message, {details: {parameterName}});  }
}
