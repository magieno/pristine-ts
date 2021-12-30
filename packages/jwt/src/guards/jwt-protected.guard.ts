import {inject, injectable} from "tsyringe";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardInterface} from "@pristine-ts/security";
import {GuardContextInterface} from "@pristine-ts/security";

/**
 * This guard is used to verify that a route can only be accessed when a request has a valid JWT.
 */
@injectable()
export class JwtProtectedGuard implements GuardInterface {
    constructor(@inject("JwtManagerInterface") private readonly jwtManager: JwtManagerInterface) {
    }

    public keyname = "jwt.protected";

    public guardContext?: GuardContextInterface

    /**
     * Verifies if the JWT is valid and authorizes access if it is.
     * @param request
     * @param identity
     */
    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.jwtManager.validateAndDecode(request)
                .then(value => resolve(true))
                .catch(reason => resolve(false));
        });
    }

    /**
     * Sets the context for the guard.
     * @param context
     */
    setContext(context: any): Promise<void> {
        this.guardContext = context;

        return Promise.resolve();
    }
}
