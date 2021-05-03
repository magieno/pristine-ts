import {inject, injectable} from "tsyringe";
import {GuardInterface, MethodRouterNode, RequestInterface} from "@pristine-ts/networking";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";
import {IdentityInterface} from "@pristine-ts/common";

@injectable()
export class JwtProtectedGuard implements GuardInterface {
    constructor(@inject("JwtManagerInterface") private readonly jwtManager: JwtManagerInterface) {
    }

    public keyname = "jwt.protected";

    isAuthorized(request: RequestInterface, methodNode: MethodRouterNode, identity?: IdentityInterface): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.jwtManager.validateAndDecode(request)
                .then(value => resolve(true))
                .catch(reason => resolve(false));
        });
    }
}
