import {RequestParameterDecoratorInterface} from "../interfaces/request-parameter-decorator.interface";
import {HeadersParameterDecoratorInterface} from "../interfaces/headers-parameter-decorator.interface";

export const headers = () => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number
    ) => {
        if (target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
            target.constructor.prototype["__metadata__"] = {}
        }

        if (target.constructor.prototype["__metadata__"].hasOwnProperty("methods") === false) {
            target.constructor.prototype["__metadata__"]["methods"] = {}
        }

        if (target.constructor.prototype["__metadata__"]["methods"].hasOwnProperty(propertyKey) === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey] = {}
        }

        if (target.constructor.prototype["__metadata__"]["methods"][propertyKey].hasOwnProperty("arguments") === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"] = [];
        }

        const methodParameter: HeadersParameterDecoratorInterface = {
            type: "headers"
        };

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"][parameterIndex] = methodParameter;
    }
};

