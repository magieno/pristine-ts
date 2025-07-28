import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";

/**
 * This Error is thrown if the Data Transformer Class is not found in the list of available interceptors. It might be missing a tag.
 */
export class DataMappingInterceptorNotFoundError extends Error {

  public constructor(message: string, uniqueKey: DataMappingInterceptorUniqueKeyType, options?: any) {
    super(message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, DataMappingInterceptorNotFoundError.prototype);
  }
}
