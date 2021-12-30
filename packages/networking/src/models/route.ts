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
     * This contains the Route context for dynamic usage.
     */
    context?: any;

    /**
     * @param controllerInstantiationToken The instantiation token of the controller. Usually this will be the controller's constructor name.
     * @param methodPropertyKey The name of the method that corresponds to the route in the controller.
     */
    constructor(public readonly controllerInstantiationToken: any, public readonly methodPropertyKey: string) {
    }
}
