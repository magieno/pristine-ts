/**
 * The interface that represents the identity containing the claims provided by a JWT.
 */
export interface IdentityInterface {
  id: string;
  claims: { [id: string]: any }
}
