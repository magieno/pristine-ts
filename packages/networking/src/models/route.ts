import {AuthenticatorInterface, GuardInterface} from "@pristine-ts/security";
import {ParameterDecoratorInterface} from "../interfaces/parameter-decorator.interface";

/**
 * This class represents a Route and how it can be routed to the proper controller method.
 */
export class Route {
    /**
     * This array contains all the arguments, in order, to pass to the Controller method corresponding to this route.
     */
    methodArguments: ParameterDecoratorInterface[] = [];

    /**
     * This contains the authenticator for this route.
     */
    authenticator?: AuthenticatorInterface;

    /**
     * This contains the Route context for dynamic usage.
     */
    context?: any;

    constructor(public readonly controllerInstantiationToken: any, public readonly methodPropertyKey: string) {
    }
}
