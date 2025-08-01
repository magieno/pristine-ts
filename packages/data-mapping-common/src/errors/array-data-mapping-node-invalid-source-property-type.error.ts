/**
 * This Error is thrown when a node is of type array but the `source[sourceProperty]` doesn't actually contain an array.
 */
export class ArrayDataMappingNodeInvalidSourcePropertyTypeError extends Error {

  public constructor(message: string, sourceProperty: string) {
    super(message);


    // Set the prototype explicitly.
    // As specified in the documentation in TypeScript
    // https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, ArrayDataMappingNodeInvalidSourcePropertyTypeError.prototype);
  }
}
