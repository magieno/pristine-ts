/**
 * The JWT header decoded from a Firebase ID token. The `kid` selects which of the
 * fetched X.509 certs verifies the signature.
 */
export interface TokenHeaderInterface {
  alg: string;
  typ?: string;
  kid: string;
}
