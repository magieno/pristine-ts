/**
 * This Error is thrown when a normalizer is added more than once.
 */
export class DataNormalizerAlreadyAdded extends Error {

    public constructor(message: string, normalizerUniqueKey: string, options?: any) {
        super(message);


        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DataNormalizerAlreadyAdded.prototype);
    }
}
