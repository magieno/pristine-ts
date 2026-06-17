/**
 * Utilities for working with plain objects.
 */
export class ObjectUtil {
  /**
   * Deep-merges `sources` left-to-right into a brand-new object and returns it. This is a
   * dependency-free replacement for `lodash.merge({}, ...sources)`, reproducing the subset
   * of its behaviour the framework relies on when combining a class-level and a method-level
   * route context:
   *
   * - plain objects are merged recursively (a key present on both sides is deep-merged, NOT
   *   overwritten — e.g. `@responseHeader` maps from both levels are combined);
   * - arrays are merged by index — element `i` of a later source merges onto element `i` of
   *   the earlier one and extra elements are appended (matching lodash, which neither
   *   concatenates nor replaces the array wholesale — e.g. `@guard`);
   * - a source value of `undefined` never overwrites an already-present value;
   * - every other value (primitive, function, Date, class instance, ...) from a later source
   *   overwrites the earlier one by assignment.
   *
   * None of the `sources` are mutated: plain objects and arrays are cloned into a fresh
   * target as they are merged, so the result shares no references with its inputs.
   */
  public static deepMerge(...sources: any[]): any {
    const target: any = {};

    for (const source of sources) {
      ObjectUtil.mergeInto(target, source);
    }

    return target;
  }

  /**
   * Merges the enumerable own properties of `source` into `target` in place. `target` is
   * always an object owned by the caller (never one of the original sources), so mutating it
   * here is safe. Non-object sources (including `undefined`/`null`) are ignored.
   * @private
   */
  private static mergeInto(target: any, source: any): void {
    if (source === null || typeof source !== "object") {
      return;
    }

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];

      // lodash.merge skips source properties that resolve to `undefined`.
      if (sourceValue === undefined) {
        continue;
      }

      target[key] = ObjectUtil.mergeValue(target[key], sourceValue);
    }
  }

  /**
   * Computes the merged value for a single key: recurse into arrays (by index) and plain
   * objects, otherwise take the source value. Always returns a value owned by the target tree
   * (source containers are cloned) so inputs are never aliased.
   * @private
   */
  private static mergeValue(targetValue: any, sourceValue: any): any {
    if (Array.isArray(sourceValue)) {
      const merged: any[] = Array.isArray(targetValue) ? targetValue : [];

      sourceValue.forEach((element, index) => {
        // Parity with lodash.merge: an `undefined` element does not clear an existing one.
        if (element === undefined) {
          return;
        }
        merged[index] = ObjectUtil.mergeValue(merged[index], element);
      });

      return merged;
    }

    if (ObjectUtil.isPlainObject(sourceValue)) {
      const merged: any = ObjectUtil.isPlainObject(targetValue) ? targetValue : {};
      ObjectUtil.mergeInto(merged, sourceValue);
      return merged;
    }

    return sourceValue;
  }

  /**
   * True only for object literals (`{}`-style or `Object.create(null)`); false for arrays,
   * class instances, Dates, functions, `null` and primitives — i.e. the values `deepMerge`
   * should overwrite rather than recurse into.
   * @private
   */
  private static isPlainObject(value: any): boolean {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }
}
