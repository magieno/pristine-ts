import {inject, injectable} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardInterface} from "../interfaces/guard.interface";
import {GuardContextInterface} from "../interfaces/guard-context.interface";

@injectable()
export class RoleGuard implements GuardInterface {
    public keyname = "role";

    public guardContext: GuardContextInterface;

    constructor(@inject("%pristine.security.rolesClaimKey%") private rolesClaimKey: string) {
    }

    setContext(context: any): Promise<void> {
        this.guardContext = context;

        return Promise.resolve();
    }

    async isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        const neededRoles: string[] = [];
        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("roles") && Array.isArray(this.guardContext.options.roles)){
            neededRoles.push(... this.guardContext.options.roles);
        }

        if(neededRoles.length > 0 && (identity?.claims?.hasOwnProperty(this.rolesClaimKey) === false || !Array.isArray(identity?.claims[this.rolesClaimKey]))){
            return false;
        }
        for(const role of neededRoles) {
            if(!identity?.claims[this.rolesClaimKey].includes(role)){
                return false;
            }
        }
        return true;
    }
}
