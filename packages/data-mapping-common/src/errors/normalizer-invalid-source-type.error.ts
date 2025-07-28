/**
 * This Error is thrown when an invalid source type is passed to the source type while the normalizer expects another type.
 */
export class NormalizerInvalidSourceTypeError extends Error {

  public constructor(message: string, normalizerUniqueKey: string, options: any, source: any, sourceType: any) {
    super(message);

    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, NormalizerInvalidSourceTypeError.prototype);
  }
}
