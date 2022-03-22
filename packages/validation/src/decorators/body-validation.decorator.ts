/**
 * The bodyValidation decorator can be used to validate the body of a request.
 * @param classType The class that the request body is expected to fit.
 */
export const bodyValidation = (classType: Function) => {
    return (
        /**
         * The class on which the decorator is used.
         */
        target: Record<string, unknown>,

        /**
         * The method on which the decorator is used.
         */
        propertyKey: string | symbol,

        /**
         * The descriptor of the property.
         */
        descriptor: PropertyDescriptor
    ) => {

        // If there's a descriptor, then it's not a controller guard, but a method guard
        if(target.constructor.prototype.hasOwnProperty("__metadata__") === false) {
            target.constructor.prototype["__metadata__"] = {}
        }

        if(target.constructor.prototype["__metadata__"].hasOwnProperty("methods") === false) {
            target.constructor.prototype["__metadata__"]["methods"] = {}
        }

        if(target.constructor.prototype["__metadata__"]["methods"].hasOwnProperty(propertyKey) === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey] = {}
        }

        if(target.constructor.prototype["__metadata__"]["methods"][propertyKey].hasOwnProperty("__routeContext__") === false) {
            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"] = {}
        }

        // Adds the validation to the route context.
        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["bodyValidator"] = {
            classType,
        };
    }
}

