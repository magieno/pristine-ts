import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents a configuration error when an error occurs in a resolver.
 */
export class ConfigurationResolverError extends PristineError {
  public constructor(message: string, value: any) {
    super(message, {details: {
      value,
      type: typeof (value),
    }});  }
}
