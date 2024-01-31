import {injectable} from "tsyringe";
import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {NumberNormalizerOptions} from "../normalizer-options/number-normalizer.options";
import {TypeEnum, TypeUtils} from "@pristine-ts/metadata";

@injectable()
export class NumberNormalizer implements DataNormalizerInterface<number | undefined, NumberNormalizerOptions> {
    getUniqueKey(): string {
        return NumberNormalizerOptions.name;
    }

    normalize(source: any, options?: NumberNormalizerOptions): number | undefined {
        const typeEnum = TypeUtils.getTypeOfValue(source);

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

        if (typeEnum === undefined) {
            if (options?.ignoreUndefined === false) {
                return 0;
            }

            return undefined;
        }
    }
}