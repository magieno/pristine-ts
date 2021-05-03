import {inject, injectable} from "tsyringe";
import {MethodRouterNode, } from "@pristine-ts/networking";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardInterface} from "@pristine-ts/security";

@injectable()
export class CognitoGroupGuard implements GuardInterface {
    public keyname = "cognito.group";

    private context;

    setContext(context: any): Promise<void> {
        this.context = context;

        return Promise.resolve();
    }

    async isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        const neededGroups: string[] = [];
        if(this.context.hasOwnProperty("groups") && Array.isArray(this.context.groups)){
            neededGroups.push(... this.context.groups);
        }

        if(neededGroups.length > 0 && (identity?.claims?.hasOwnProperty("cognito:groups") === false || !Array.isArray(identity?.claims["cognito:groups"]))){
            return false;
        }
        neededGroups.forEach(group => {
            if(!identity?.claims["cognito:groups"].include(group)){
                return false;
            }
        })
        return true;
    }
}
