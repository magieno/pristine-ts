import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {NumberNormalizerOptions} from "../normalizer-options/number-normalizer.options";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";
import {BaseNormalizer} from "./base.normalizer";

export class NumberNormalizer extends BaseNormalizer<NumberNormalizerOptions> implements DataNormalizerInterface<number | undefined, NumberNormalizerOptions> {
    getUniqueKey(): string {
        return "PRISTINE_NUMBER_NORMALIZER";
    }

    normalize(source: any, options?: NumberNormalizerOptions): number | undefined {
        const typeEnum = TypeUtils.getTypeOfValue(source);

        options = this.getOptions(options);

        switch (typeEnum) {
            case TypeEnum.String:
                const value = parseFloat(source);

                if(isNaN(value) === false) {
                    return value;
                }
                break;

            case TypeEnum.Number:
                return source;
        }

        if (typeEnum === undefined || typeEnum === TypeEnum.Null) {
            if (options?.ignoreUndefined === false) {
                return 0;
            }

            return undefined;
        }
    }
}