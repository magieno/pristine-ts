import {inject, injectable} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";

@injectable()
export class Auth0RoleGuard implements GuardInterface {
    public keyname = "auth0.role";

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

        if(neededRoles.length > 0 && (identity?.claims?.hasOwnProperty("roles") === false || !Array.isArray(identity?.claims["roles"]))){
            return false;
        }
        for(const group of neededRoles) {
            if(!identity?.claims["roles"].includes(group)){
                return false;
            }
        }
        return true;
    }
}
