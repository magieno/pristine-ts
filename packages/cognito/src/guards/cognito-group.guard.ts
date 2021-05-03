import {inject, injectable} from "tsyringe";
import {GuardInterface, MethodRouterNode, RequestInterface} from "@pristine-ts/networking";
import {IdentityInterface} from "@pristine-ts/common";

@injectable()
export class CognitoGroupGuard implements GuardInterface {
    constructor() {
    }

    public keyname = "cognito.group";

    async isAuthorized(request: RequestInterface, methodNode: MethodRouterNode, identity?: IdentityInterface): Promise<boolean> {
        const neededGroups: string[] = [];
        if(methodNode.route.controllerContext.hasOwnProperty("groups") && Array.isArray(methodNode.route.controllerContext.groups)){
            neededGroups.push(... methodNode.route.controllerContext.groups);
        }
        if(methodNode.route.methodContext.hasOwnProperty("groups") && Array.isArray(methodNode.route.methodContext.groups)){
            neededGroups.push(... methodNode.route.methodContext.groups);
        }

        //todo: verify how congito sends the groups
        if(neededGroups.length > 0 && !identity?.claims?.groups){
            return false;
        }
        neededGroups.forEach(group => {
            if(!identity?.claims?.groups?.include(group)){
                return false;
            }
        })
        return true;
    }
}
