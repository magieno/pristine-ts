import {injectable} from "tsyringe";
import {JwtManager} from "../managers/jwt.manager";
import {GuardInterface, RequestInterface} from "@pristine-ts/networking";
import {JwtManagerInterface} from "../interfaces/jwt-manager.interface";

@injectable()
export class JwtProtectedGuard implements GuardInterface {
    constructor(private readonly jwtManager: JwtManagerInterface) {
    }

    keyname: "jwt.protected";

    isAuthorized(request: RequestInterface): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.jwtManager.validateAndDecode(request)
                .then(value => resolve(true))
                .catch(reason => resolve(false));
        });
    }
}