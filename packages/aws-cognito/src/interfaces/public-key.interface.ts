/**
 * The public key interface.
 */
export interface PublicKeyInterface {
  /**
   * The specific cryptographic algorithm used with the key.
   */
  alg: string;

  /**
   * The exponent for the RSA public key.
   */
  e: string;

  /**
   * The unique identifier for the key.
   */
  kid: string;

  /**
   * The family of cryptographic algorithms used with the key.
   */
  kty: string;

  /**
   *  The modulus for the RSA public key.
   */
  n: string;

  /**
   * How the key was meant to be used; sig represents the signature.
   */
  use: string;
}
