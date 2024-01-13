import "reflect-metadata";

export const controllerRegistry: any[] = [];

export const basePathMetadataKeyname = "@controller:basePath";

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
        Reflect.defineMetadata(basePathMetadataKeyname, basePath, constructor.prototype);

        // Push the class prototype in the controllerRegistry that is used to instantiate all the controllers for the router.
        controllerRegistry.push(constructor.prototype)
    }
}
