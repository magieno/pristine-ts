import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {BaseNormalizer} from "./base.normalizer";
import {BooleanNormalizerOptions} from "../normalizer-options/boolean-normalizer.options";

export const BooleanNormalizerUniqueKey = "PRISTINE_BOOLEAN_NORMALIZER";

export class BooleanNormalizer extends BaseNormalizer<BooleanNormalizerOptions> implements DataNormalizerInterface<boolean, BooleanNormalizerOptions> {
  getUniqueKey(): string {
    return BooleanNormalizerUniqueKey;
  }

  normalize(source: any, options?: BooleanNormalizerOptions): boolean {
    const typeEnum = TypeUtils.getTypeOfValue(source);

    switch (typeEnum) {
      case TypeEnum.String:
        return source === "true" || source === "1";

      case TypeEnum.Number:
        return source === 1;

      case TypeEnum.Boolean:
        return source;
      default:
        return false
    }
  }
}