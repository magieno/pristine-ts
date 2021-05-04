import {inject, injectable} from "tsyringe";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";

@injectable()
export class AwsCognitoGroupGuard implements GuardInterface {
    public keyname = "cognito.group";

    public guardContext: GuardContextInterface;

    setContext(context: any): Promise<void> {
        this.guardContext = context;

        return Promise.resolve();
    }

    async isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        const neededGroups: string[] = [];
        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("groups") && Array.isArray(this.guardContext.options.groups)){
            neededGroups.push(... this.guardContext.options.groups);
        }

        if(neededGroups.length > 0 && (identity?.claims?.hasOwnProperty("cognito:groups") === false || !Array.isArray(identity?.claims["cognito:groups"]))){
            return false;
        }
        neededGroups.forEach(group => {
            if(!identity?.claims["cognito:groups"].includes(group)){
                return false;
            }
        })
        return true;
    }
}
