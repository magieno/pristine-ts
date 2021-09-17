import {RequestInterface} from "@pristine-ts/common";

/**
 * The JwtManager Interface defines the methods that a JWT manager must implement.
 */
export interface JwtManagerInterface {
    /**
     * Validates and returns the decoded JWT.
     * @param request The request containing the JWT.
     */
    validateAndDecode(request: RequestInterface): Promise<any>;
}
