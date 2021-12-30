import {ParameterDecoratorInterface} from "./parameter-decorator.interface";

/**
 * This interface represents the object that will contain the information to know how to handle the
 * @routeParameter decorator.
 */
export interface RouteParameterDecoratorInterface extends ParameterDecoratorInterface {
    type: "routeParameter";

    /**
     * This parameter represents the name of the router parameter you want. Let's say you want the id to be passed
     * to your controller method and the url is: /api/2.0/dogs/{id}/puppies/{puppyId} you would put "id" as the routeParameterName
     * and if you wanted the id of the puppy, you would put "puppyId".
     */
    routeParameterName: string;
}
