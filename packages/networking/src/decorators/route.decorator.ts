import "reflect-metadata";
import {HttpMethod, MetadataUtil, MetadataEnum} from "@pristine-ts/common";
import {RouteMethodDecorator} from "../interfaces/route-method-decorator.interface";
import {ClassMetadata, MethodMetadata} from "@pristine-ts/metadata";

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
        // Set the route.
        const route: RouteMethodDecorator = {
            httpMethod,
            methodKeyname: propertyKey,
            path
        }

        MethodMetadata.defineMetadata(target, propertyKey, MetadataEnum.Route, route);

        ClassMetadata.appendToMetadata(target.constructor, MetadataEnum.ControllerRoutes, propertyKey);
    };
}
