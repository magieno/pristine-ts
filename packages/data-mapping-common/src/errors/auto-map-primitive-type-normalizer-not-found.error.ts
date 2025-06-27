import {PrimitiveType} from "../enums/primitive-type.enum";

/**
 * This Error is thrown when the after row interceptor is added more than once to the builder.
 */
export class AutoMapPrimitiveTypeNormalizerNotFoundError extends Error {

  public constructor(message: string, private readonly primitiveType: PrimitiveType, options?: any) {
    super(message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, AutoMapPrimitiveTypeNormalizerNotFoundError.prototype);
  }
}
