import {inject, injectable} from "tsyringe";
import {GuardInterface, RequestInterface} from "@pristine-ts/networking";
import {IdentityInterface} from "@pristine-ts/common";

@injectable()
export class CognitoGroupGuard implements GuardInterface {
    constructor() {
    }

    public keyname = "cognito.group";

    async isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        return true;
    }
}
