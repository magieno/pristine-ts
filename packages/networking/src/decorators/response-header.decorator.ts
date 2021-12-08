/**
 * The responseHeader decorator can be used to specify a header that needs to be added to the response before sending it back.
 * This decorator can be used with either method (route) or a class (controller).
 * If used on the class than it will be applied to every route of the controller.
 * @param key The key of the header
 * @param value The value to set the header to.
 */
export const responseHeader = (key: string, value: string) => {
    return (
        /**
         * The class on which the decorator is used.
         */
        target: any,

        /**
         * The method on which the decorator is used.
         */
        propertyKey?: string,

        /**
         * The descriptor of the property
         */
        descriptor?: PropertyDescriptor
    ) => {

        // If there's a descriptor and a property key, then it's not a controller decorator, but a method decorator
        if(descriptor && propertyKey) {
            // Verify that the object target.constructor.prototype["__metadata__"]["methods"][propertyKey]["__routeContext__"]["responseHeaders"] exists or we create it.
            // This object is a convention defined by Pristine on where to save controller method parameter decorator information and is used in the router to retrieve that information.
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
            // It is a controller decorator
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

