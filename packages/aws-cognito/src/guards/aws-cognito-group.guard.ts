import {inject, injectable} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";
import {GuardContextInterface, GuardInterface} from "@pristine-ts/security";
import {Request} from "@pristine-ts/common";

/**
 * A guard for which you can specify the Cognito groups that a user needs to access call. To be used with the @guard decorator (ie:
 @guard(AwsCognitoGroupGuard, {groups: ["ADMIN"]}) ).
 */
@injectable()
export class AwsCognitoGroupGuard implements GuardInterface {
    public keyname = "cognito.group";

    public guardContext?: GuardContextInterface;

    /**
     * Sets the context for the guard.
     * @param context Should be of type GuardContextInterface.
     */
    setContext(context: any): Promise<void> {
        this.guardContext = context;

        return Promise.resolve();
    }

    /**
     * Verifies if user with identity is authorized to access a call.
     * @param request The request being made.
     * @param identity The identity making the request.
     */
    async isAuthorized(request: Request, identity?: IdentityInterface): Promise<boolean> {
        const neededGroups: string[] = [];
        if(this.guardContext === undefined) {
            return false;
        }

        if(this.guardContext.options && this.guardContext.options.hasOwnProperty("groups") && Array.isArray(this.guardContext.options.groups)){
            neededGroups.push(... this.guardContext.options.groups);
        }

        // Cognito saves the role in the property cognito:groups
        if(neededGroups.length > 0 && (identity?.claims?.hasOwnProperty("cognito:groups") === false || !Array.isArray(identity?.claims["cognito:groups"]))){
            return false;
        }
        for(const group of neededGroups) {
            if(!identity?.claims["cognito:groups"].includes(group)){
                return false;
            }
        }
        return true;
    }
}
