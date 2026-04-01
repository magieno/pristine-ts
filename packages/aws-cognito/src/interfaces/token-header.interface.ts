/**
 * The token header interface.
 */
export interface TokenHeaderInterface {
  /**
   * The unique identifier of the key used for the token.
   */
  kid: string;

  /**
   * The specific cryptographic algorithm used with the key.
   */
  alg: string;
}
