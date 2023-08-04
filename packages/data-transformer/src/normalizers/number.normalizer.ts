import {injectable} from "tsyringe";
import {DataNormalizer} from "../interfaces/data-normalizer.interface";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";

@tag(ServiceDefinitionTagEnum.DataNormalizer)
@injectable()
class NumberNormalizer implements DataNormalizer<number, NumberNormalizerOptions>{
    getUniqueKey(): DataNormalizerUniqueKey {
        return NumberNormalizer.name;
    }

    normalize(source: any): number {
        // todo: Transform source into a number;
        return 0;
    }
}