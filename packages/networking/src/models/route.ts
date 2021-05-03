import {BodyParameterDecoratorInterface} from "../interfaces/body-parameter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";
import {QueryParametersDecoratorInterface} from "../interfaces/query-parameters-decorator.interface";
import {RouteParameterDecoratorInterface} from "../interfaces/route-parameter-decorator.interface";
import {GuardInterface} from "@pristine-ts/security";
import {AuthenticatorInterface} from "@pristine-ts/security";

/**
 * This class represents a Route and how it can be routed to the proper controller method.
 */
export class Route {
    /**
     * This array contains all the arguments, in order, to pass to the Controller method corresponding to this route.
     */
        //todo: should we add all parameter decorator interface ? what about ones from other modules ?
    methodArguments: (BodyParameterDecoratorInterface | QueryParameterDecoratorInterface | QueryParametersDecoratorInterface | RouteParameterDecoratorInterface)[] = [];

    /**
     * This contains an array of all the guards protecting this route.
     */
    guards: GuardInterface[] = [];

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
