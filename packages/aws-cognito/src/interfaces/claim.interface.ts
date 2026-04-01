/**
 * The interface of the claims in AWS Cognito.
 */
export interface ClaimInterface {

  /**
   * The use for which the token is used (ie: access)
   */
  token_use: string;

  /**
   * The time at which the authentication happened.
   */
  auth_time: number;

  /**
   * The issuer of the token.
   */
  iss: string;

  /**
   * The expiration timestamp of the token.
   */
  exp: number;

  /**
   * The cognito username.
   */
  ["cognito:username"]: string;

  /**
   * The client id.
   */
  client_id: string;

  /**
   * The cognito groups.
   */
  ["cognito:groups"]: string[];

  /**
   * The other claims part of the token.
   */
  [key: string]: any;
}
