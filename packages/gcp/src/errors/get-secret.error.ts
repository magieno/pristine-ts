/**
 * Thrown by `SecretManagerClient` when a secret retrieval fails (not found, missing
 * payload, JSON parse error, missing key). Mirrors `GetSecretSecretsManagerError`
 * in `@pristine-ts/aws`.
 */
export class GetSecretError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GetSecretError.prototype);
    this.name = "GetSecretError";
  }
}
