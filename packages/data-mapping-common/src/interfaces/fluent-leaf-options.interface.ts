import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

/**
 * Options for a fluent leaf field — used by both `field()` and `arrayOfScalars()` on
 * `BaseDataMappingNode`. Both expose the same per-leaf knobs (normalizers, optional flag,
 * excluded inherited normalizers), so they share this options shape.
 */
export interface FluentLeafOptions {
  /**
   * Normalizers to apply to the value as it flows from source to destination. Each entry is
   * either a unique key (shorthand) or `{key, options}` to pass normalizer-specific options.
   */
  normalizers?: Array<DataNormalizerUniqueKey | {key: DataNormalizerUniqueKey, options?: any}>;

  /**
   * Normalizers added at the builder root that should NOT apply to this leaf. Useful when a
   * global normalizer (e.g. lowercase everything) needs to be skipped for one specific field
   * (e.g. an API key that's case-sensitive).
   */
  excludeNormalizers?: DataNormalizerUniqueKey[];

  /**
   * When true, the leaf is skipped silently if the source property is missing. When false /
   * undefined, a missing source property throws `DataMappingSourcePropertyNotFoundError`.
   */
  isOptional?: boolean;
}
