import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {StringNormalizerOptions} from "../normalizer-options/string-normalizer.options";
import {format} from "date-fns";
import {BaseNormalizer} from "./base.normalizer";

export const StringNormalizerUniqueKey = "PRISTINE_STRING_NORMALIZER";

export class StringNormalizer extends BaseNormalizer<StringNormalizerOptions> implements DataNormalizerInterface<string | undefined, StringNormalizerOptions> {
  getUniqueKey(): string {
    return StringNormalizerUniqueKey;
  }

  normalize(source: any, options?: StringNormalizerOptions): string | undefined {
    const typeEnum = TypeUtils.getTypeOfValue(source);

    options = this.getOptions(options);

    if (typeEnum === undefined || typeEnum === TypeEnum.Null) {
      if (options?.ignoreUndefined === false) {
        return "";
      }

      return undefined;
    }

    switch (typeEnum) {
      case TypeEnum.String:
        return source;

      case TypeEnum.Number:
        return "" + source;

      case TypeEnum.Boolean:
        return source ? "true" : "false";

      case TypeEnum.Date:
        if (options?.dateFormat) {
          return format(source, options.dateFormat);
        }

        // This will return the default format we want: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON
        return (source as Date).toJSON();

      case TypeEnum.Array:
        return source.map((item: any) => this.normalize(item, options));

      case TypeEnum.Symbol:
        return source.toString();

      case TypeEnum.Object:
        if (source.hasOwnProperty("toString") === true) {
          try {
            return source.toString();
          } catch {
            // Custom toString threw — fall through to JSON.stringify.
          }
        }

        return this.safeStringify(source);

      // For now, let's do that for other types. We can make it better eventually.
      default:
        return this.safeStringify(source);
    }
  }

  /**
   * Total stringifier. A normalizer must never propagate a throw from a user-supplied
   * value's `toString` / `Symbol.toPrimitive` or from a circular `JSON.stringify` —
   * normalization runs inside data-mapping pipelines whose callers don't expect to catch.
   */
  private safeStringify(value: unknown): string {
    try {
      const json = JSON.stringify(value);
      if (json !== undefined) {
        return json;
      }
    } catch {
      // Circular reference, BigInt, throwing toJSON, etc. Fall through.
    }

    try {
      return String(value);
    } catch {
      return "[unrepresentable]";
    }
  }
}