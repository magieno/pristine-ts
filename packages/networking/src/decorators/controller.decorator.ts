export const controllerRegistry: any[] = [];

/**
 * The controller decorator can be used on a class to register this class as a controller in the router.
 * @param basePath The base path for all the routes in the controller.
 */
export const controller = (basePath: string) => {
    return (
        /**
         * The constructor of the class
         */
        constructor: Function
    ) => {
        // Verify that the object constructor.prototype["__metadata__"]["controller"][basePath] exists or we create it.
        // This object is a convention defined by Pristine on where to save controller decorator information and is used in the router to retrieve that information.
        if(constructor.prototype.hasOwnProperty("__metadata__") === false) {
            constructor.prototype["__metadata__"] = {}
        }


        if(constructor.prototype["__metadata__"].hasOwnProperty("controller") === false) {
            constructor.prototype["__metadata__"]["controller"] = {}
        }

        // Save the base path.
        constructor.prototype["__metadata__"]["controller"]["basePath"] = basePath;

        // Push the class prototype in the controllerRegistry that is used to instantiate all the controllers for the router.
        controllerRegistry.push(constructor.prototype)
    }
}
