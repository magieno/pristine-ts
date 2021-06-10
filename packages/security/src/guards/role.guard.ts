import {inject, injectable} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardContextInterface} from "../interfaces/guard-context.interface";

@injectable()
export class RoleGuard implements GuardInterface {
    public keyname = "role";

    public guardContext: GuardContextInterface;

    setContext(context: any): Promise<void> {
        this.guardContext = context;

        return Promise.resolve();
    }

    async isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        const neededRoles: string[] = [];
        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("roles") && Array.isArray(this.guardContext.options.roles)){
            neededRoles.push(... this.guardContext.options.roles);
        }
        let rolesClaimKey = "roles";
        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("rolesClaimKey")) {
            rolesClaimKey = this.guardContext.options.rolesClaimKey;
        }
        if(neededRoles.length > 0 && (identity?.claims?.hasOwnProperty(rolesClaimKey) === false || !Array.isArray(identity?.claims[rolesClaimKey]))){
            return false;
        }
        for(const role of neededRoles) {
            if(!identity?.claims[rolesClaimKey].includes(role)){
                return false;
            }
        }
        return true;
    }
}
