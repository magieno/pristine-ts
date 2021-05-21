
export const bodyValidation = (instance: string) => {
    return ( target: any,
             propertyKey: string,
             descriptor: PropertyDescriptor) => {

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

        target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["bodyValidator"] = {
            instance,
        };
    }
}

