import {HttpMethod} from "@pristine-ts/common";
import {RouteMethodDecorator} from "../interfaces/route-method-decorator.interface";

/**
 * The route decorator can be used on a method to register this method as a route of the controller in the router.
 * @param httpMethod The http method of the route
 * @param path The part of the path following the base path of the controller. For path parameters use the colons. (ie: resources/:id)
 */
export const route = (httpMethod: HttpMethod | string, path: string) => {
    return (
        /**
         * The class on which the decorator is used.
         */
        target: any,

        /**
         * The method on which the decorator is used.
         */
        propertyKey: string,

        /**
         * The descriptor of the property.
         */
        descriptor: PropertyDescriptor
    ) => {
        // Verify that the object target.constructor.prototype["__metadata__"]["methods"][propertyKey]["route"] exists or we create it.
        // This object is a convention defined by Pristine on where to save the route decorator information and is used in the router to retrieve that information.
        if(target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
            target.constructor.prototype["__metadata__"] = {}
        }

        if(target.constructor.prototype["__metadata__"].hasOwnProperty("methods") === false) {
            target.constructor.prototype["__metadata__"]["methods"] = {}
        }

        if(target.constructor.prototype["__metadata__"]["methods"].hasOwnProperty(propertyKey) === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey] = {}
        }

        // Set the route.
        const route: RouteMethodDecorator = {
            httpMethod,
            methodKeyname: propertyKey,
            path
        }

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["route"] = route;
    };
}
