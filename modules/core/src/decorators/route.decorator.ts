import {HttpMethod} from "../enums/http-method.enum";
import {MethodDecoratorRoute} from "../interfaces/method-decorator-route.interface";

export const route = (httpMethod: HttpMethod | string, path: string) => {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) => {
        if(target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
            target.constructor.prototype["__metadata__"] = {}
        }

        if(target.constructor.prototype["__metadata__"].hasOwnProperty("methods") === false) {
            target.constructor.prototype["__metadata__"]["methods"] = {}
        }

        if(target.constructor.prototype["__metadata__"]["methods"].hasOwnProperty(propertyKey) === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey] = {}
        }

        const route: MethodDecoratorRoute= {
            httpMethod,
            propertyKey,
            path
        }

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["route"] = route;
    };
}