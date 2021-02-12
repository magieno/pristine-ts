import {JwtPayloadDecoratorInterface} from "../interfaces/jwt-payload-decorator.interface";

export const jwtPayload = () => {
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

        const methodParameter: JwtPayloadDecoratorInterface = {
            type: "jwtPayload"
        };

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"][parameterIndex] = methodParameter;
    }
};