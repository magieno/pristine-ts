import {inject, injectable} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardContextInterface} from "../interfaces/guard-context.interface";
import {Request} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SecurityModuleKeyname} from "../security.module.keyname";

/**
 * The role guard is a guard that validates if the identity making the request has the required roles.
 */
@injectable()
export class RoleGuard implements GuardInterface {
    /**
     * The keyname of the guard.
     */
    public keyname = "role";

    /**
     * The context for the guard to use.
     */
    public guardContext?: GuardContextInterface;

    /**
     * The role guard is a guard that validates if the identity making the request has the required roles.
     * @param rolesClaimKey The key in the claims of the access token where the roles are defined.
     */
    constructor(@inject("%pristine.security.rolesClaimKey%") private readonly rolesClaimKey: string,
                @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
    }

    /**
     * Sets the context for the guard.
     * @param context The context for the guard to use.
     */
    async setContext(context: any): Promise<void> {
        this.guardContext = context;

        this.logHandler.debug("Setting the context", {context}, SecurityModuleKeyname);

        return Promise.resolve();
    }

    /**
     * Returns whether or not the guard authorizes the request.
     * For the role guard, it validates that the identity making the request has the requested roles.
     * The identity needs all of the requested roles to be authorized.
     * @param request The request to authorize.
     * @param identity The identity making the request.
     */
    async isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
        const neededRoles: string[] = [];

        // If we have no context we deny.
        if(this.guardContext === undefined) {
            return false;
        }

        // Find what roles are needed based on the context.
        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("roles") && Array.isArray(this.guardContext.options.roles)){
            neededRoles.push(... this.guardContext.options.roles);
        }

        // If the identity does not have a roles claim, we deny.
        if(neededRoles.length > 0 && (identity?.claims?.hasOwnProperty(this.rolesClaimKey) === false || !Array.isArray(identity?.claims[this.rolesClaimKey]))){
            this.logHandler.debug("Identity doesn't have a roles claim. Denying.", {request, identity, neededRoles}, SecurityModuleKeyname);
            return false;
        }

        // If the identity is missing one of the needed roles, we deny.
        for(const role of neededRoles) {
            if(!identity?.claims[this.rolesClaimKey].includes(role)){
                this.logHandler.debug("Role not found in claims. Denying.", {request, identity, neededRoles, role}, SecurityModuleKeyname);
                return false;
            }
        }

        // If the identity has all the requested roles we authorize.
        return true;
    }
}
