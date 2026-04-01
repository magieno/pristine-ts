/**
 * The JwtManager Interface defines the methods that a JWT manager must implement.
 */
import {Request} from "@pristine-ts/common";

export interface JwtManagerInterface {
  /**
   * Validates and returns the decoded JWT.
   * @param request The request containing the JWT.
   */
  validateAndDecode(request: Request): Promise<any>;
}
