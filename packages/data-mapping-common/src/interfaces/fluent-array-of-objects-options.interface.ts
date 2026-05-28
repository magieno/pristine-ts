import {ClassConstructor} from "class-transformer";
import {ArrayMemberTypeFactoryCallbackType} from "../types/array-member-type-factory-callback.type";

/**
 * Options for a fluent array-of-objects field (`arrayOfObjects()` on `BaseDataMappingNode`).
 *
 * Unlike `FluentNestedOptions`, `destinationType` here also accepts a factory callback for
 * polymorphic arrays — where each element of the array maps to a different concrete class
 * (e.g. an `items` array containing both `Cat` and `Dog`, discriminated by a `kind` field).
 */
export interface FluentArrayOfObjectsOptions {
  /**
   * When true, the array node is skipped silently if the source property is missing.
   */
  isOptional?: boolean;

  /**
   * Either a class constructor (uniform array — every element maps to the same class) or a
   * factory callback `(source, sourceProperty, index) => instance` that picks the concrete
   * class per element.
   */
  destinationType?: ClassConstructor<any> | ArrayMemberTypeFactoryCallbackType;
}
