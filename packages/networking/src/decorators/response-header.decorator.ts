export const responseHeader = (key: string, value: string) => {
    return ( target: any,
             propertyKey?: string,
             descriptor?: PropertyDescriptor) => {

        // If there's a descriptor, then it's not a controller guard, but a method guard
        if(descriptor && propertyKey) {
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

            if(target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"].hasOwnProperty("responseHeaders") === false) {
                target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["responseHeaders"] = {}
            }

            target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["responseHeaders"][key] = value;
        }
        else {
            if(target.prototype.hasOwnProperty("__metadata__") === false) {
                target.prototype["__metadata__"] = {}
            }

            if(target.prototype["__metadata__"].hasOwnProperty("controller") === false) {
                target.prototype["__metadata__"]["controller"] = {}
            }

            if (target.prototype["__metadata__"]["controller"].hasOwnProperty("__routeContext__") === false) {
                target.prototype["__metadata__"]["controller"]["__routeContext__"] = {}
            }

            if(target.prototype["__metadata__"]["controller"]["__routeContext__"].hasOwnProperty("responseHeaders") === false) {
                target.prototype["__metadata__"]["controller"]["__routeContext__"]["responseHeaders"] = {}
            }

            target.prototype["__metadata__"]["controller"]["__routeContext__"]["responseHeaders"][key] = value;
        }
    }
}

