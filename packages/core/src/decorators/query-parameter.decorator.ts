import {BodyParameterDecoratorInterface} from "../interfaces/body-parameteter-decorator.interface";
import {QueryParameterDecoratorInterface} from "../interfaces/query-parameter-decorator.interface";

export const queryParameter = (name: string) => {
    return (
        target: Object,
        propertyKey: string | symbol,
        parameterIndex: number
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

        if(target.constructor.prototype["__metadata__"]["methods"][propertyKey].hasOwnProperty("arguments") === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"] = [];
        }

        const methodParameter: QueryParameterDecoratorInterface = {
            type: "queryParameter",
            queryParameterName: name,
        };

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"][parameterIndex] = methodParameter;
    }
}