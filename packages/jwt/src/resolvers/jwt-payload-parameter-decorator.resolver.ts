import "reflect-metadata"
import {injectable} from "tsyringe";
import {ControllerMethodParameterDecoratorResolverInterface, Request} from "@pristine-ts/networking";

@injectable()
export class JwtPayloadParameterDecoratorResolver implements ControllerMethodParameterDecoratorResolverInterface {
    resolve(methodArgument: any,
            request: Request,
            routeParameters: { [p: string]: string }): any {

        // Here, we need to decrypt the header and reutrn the decrypted jwt payload

    }

    supports(methodArgument: any): boolean {
        return methodArgument && methodArgument.hasOwnProperty("type") && methodArgument.type === "body";
    }
}