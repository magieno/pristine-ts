import {HttpMethod} from "../enums/http-method.enum";
import {MethodDecoratorRoute} from "../interfaces/method-decorator-route.interface";

export const get = (path: string) => {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        if(target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
            target.constructor.prototype["__metadata__"] = {}
        }

        if(target.constructor.prototype["__metadata__"].hasOwnProperty("routes") === false) {
            target.constructor.prototype["__metadata__"]["routes"]  = []
        }

        const methodRoute: MethodDecoratorRoute = {
            method: HttpMethod.Get,
            propertyKey,
            path
        }

        target.constructor.prototype["__metadata__"]["routes"].push(methodRoute);
    };
}