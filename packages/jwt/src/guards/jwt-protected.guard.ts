import {inject, injectable} from "tsyringe";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {IdentityInterface, RequestInterface} from "@pristine-ts/common";
import {GuardInterface} from "@pristine-ts/security";

@injectable()
export class JwtProtectedGuard implements GuardInterface {
    constructor(@inject("JwtManagerInterface") private readonly jwtManager: JwtManagerInterface) {
    }

    public keyname = "jwt.protected";

    isAuthorized(request: RequestInterface, identity?: IdentityInterface): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.jwtManager.validateAndDecode(request)
                .then(value => resolve(true))
                .catch(reason => resolve(false));
        });
    }

    setContext(context: any): Promise<void> {
        return Promise.resolve();
    }
}
