import {DataNormalizer} from "../interfaces/data-normalizer.interface";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {LowercaseNormalizerOptions} from "./lowercase-normalizer.options";
import {NormalizerInvalidSourceTypeError} from "../errors/normalizer-invalid-source-type.error";

export class LowercaseNormalizer implements DataNormalizer<string, LowercaseNormalizerOptions>{
    getUniqueKey(): DataNormalizerUniqueKey {
        return LowercaseNormalizer.name;
    }

    normalize(source: any, options: LowercaseNormalizerOptions): string {
        if(typeof source !== "string") {
            if(options.shouldThrowIfTypeIsNotString) {
                throw new NormalizerInvalidSourceTypeError("The 'LowercaseNormalizer' expects the source value to be of type 'string'. Type '" + typeof source+ "' was received.", this.getUniqueKey(), options, source, typeof source)
            }

            return source;
        }

        return source.toLowerCase();
    }
}