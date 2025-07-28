/**
 * The interface of the claim of an Auth0 token.
 */
export interface ClaimInterface {
  /**
   * The issuer.
   */
  iss: string;

  /**
   * The id.
   */
  sub: string;

  /**
   * The expiration timestamp.
   */
  exp: number;

  /**
   * The audiences.
   */
  aud: string[];

  /**
   * The scope.
   */
  scope: string;

  /**
   * The other claims.
   */
  [key: string]: any;
}
