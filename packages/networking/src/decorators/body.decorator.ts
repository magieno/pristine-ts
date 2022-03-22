import {BodyParameterDecoratorInterface} from "../interfaces/body-parameter-decorator.interface";

/**
 * The body decorator can be used to inject the body of a request in a parameter of a method in a controller.
 */
export const body = () => {
    return (
        /**
         * The class on which the decorator is used.
         */
        target: unknown,

        /**
         * The method on which the decorator is used.
         */
        propertyKey: string | symbol,

        /**
         * The index of the parameter for which the decorator is used.
         */
        parameterIndex: number
    ) => {
        // Verify that the object target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"] exists or we create it.
        // This object is a convention defined by Pristine on where to save controller method parameter decorator information and is used in the router to retrieve that information.
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

        // Set the type of method parameter. Each parameter decorator has it's own type.
        const methodParameter: BodyParameterDecoratorInterface = {
            type: "body"
        };

        // Save the method parameter with the proper parameter index (index of the parameter in the list of parameters of a method).
        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["arguments"][parameterIndex] = methodParameter;
    }
};

