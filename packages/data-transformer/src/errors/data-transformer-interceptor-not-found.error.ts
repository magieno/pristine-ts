import {LoggableError} from "@pristine-ts/common";
import {Request} from "@pristine-ts/common";
import {DataTransformerInterceptorUniqueKeyType} from "../types/data-transformer-interceptor-unique-key.type";

/**
 * This Error is thrown the Data Transformer Class is not found in the list of available interceptors. It might be missing a tag.
 */
export class DataTransformerInterceptorNotFoundError extends LoggableError {

    public constructor(message: string, uniqueKey: DataTransformerInterceptorUniqueKeyType, options?: any) {
        super(message, {
            uniqueKey,
            options,
        });

        // Set the prototype explicitly.
        // As specified in the documentation in TypeScript
        // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, DataTransformerInterceptorNotFoundError.prototype);    }
}
