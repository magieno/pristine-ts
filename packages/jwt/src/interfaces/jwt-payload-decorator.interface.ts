import {ParameterDecoratorInterface} from "@pristine-ts/networking";

/**
 * The JwtPayloadDecoratorInterface defines what a JWT payload decorator needs.
 */
export interface JwtPayloadDecoratorInterface extends ParameterDecoratorInterface{
    type: "jwtPayload"
}
