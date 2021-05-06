import {ParameterDecoratorInterface} from "@pristine-ts/networking";

export interface JwtPayloadDecoratorInterface extends ParameterDecoratorInterface{
    type: "jwtPayload"
}
