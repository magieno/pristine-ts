
/**
 * This Error is thrown when a property isn't optional and should be found in the source object.
 */
export class DataMappingSourcePropertyNotFoundError extends Error {

    public constructor(message: string, sourceProperty: string) {
        super(message);


        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DataMappingSourcePropertyNotFoundError.prototype);
    }
}
