import "reflect-metadata";

export const responseHeaderMetadataKeyname = "@controller:responseHeader";

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
            const headers = Reflect.getMetadata(responseHeaderMetadataKeyname, target, propertyKey) ?? {};

            headers[key] = value;

            Reflect.defineMetadata(responseHeaderMetadataKeyname, headers, target, propertyKey);
        }
        else {
            const headers = Reflect.getMetadata(responseHeaderMetadataKeyname, target) ?? {};

            headers[key] = value;

            Reflect.defineMetadata(responseHeaderMetadataKeyname, headers, target);
        }
    }
}

