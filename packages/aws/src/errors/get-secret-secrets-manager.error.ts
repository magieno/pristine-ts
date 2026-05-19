import {PristineError} from "@pristine-ts/common";

/**
 * This Error represents an error when trying to get a secret from Secrets Manager
 */
export class GetSecretSecretsManagerError extends PristineError {

  /**
   * This Error represents an error when trying to get a secret from Secrets Manager
   * @param message The message to throw
   */
  public constructor(message: string) {
    super(message);  }
}
