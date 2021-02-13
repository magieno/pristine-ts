import "reflect-metadata"
import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface, Request} from "@pristine-ts/networking";
import {JwtManager} from "../managers/jwt.manager";

@injectable()
export class JwtPayloadParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {

    constructor(private readonly jwtManager: JwtManager) {
    }

    async resolve(methodArgument: any,
            request: Request,
            routeParameters: { [p: string]: string }): Promise<any> {

        // Here, we need to decrypt the header and return the decrypted jwt payload
        let payload = {};

        try {
            payload = await this.jwtManager.validateAndDecode(request);
        } catch (e) {
        }

        return payload;
    }

    supports(methodArgument: any): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "jwtPayload";
    }
}