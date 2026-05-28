import {ClassConstructor} from "class-transformer";

/**
 * Options for a fluent single-nested-object field (`nested()` on `BaseDataMappingNode`).
 *
 * Single-object case: `destinationType` is strictly a class constructor. The
 * polymorphic-array case (where the destination class is chosen per element) has its own
 * options interface — see `FluentArrayOfObjectsOptions`.
 */
export interface FluentNestedOptions {
  /**
   * When true, the nested node is skipped silently if the source property is missing.
   */
  isOptional?: boolean;

  /**
   * If set, the destination property is instantiated as this class (via `plainToInstance`).
   * Without it, the destination is a plain object.
   */
  destinationType?: ClassConstructor<any>;
}
