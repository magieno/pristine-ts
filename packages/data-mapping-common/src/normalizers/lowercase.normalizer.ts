import {DataNormalizerInterface} from "../interfaces/data-normalizer.interface";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {NormalizerInvalidSourceTypeError} from "../errors/normalizer-invalid-source-type.error";
import {LowercaseNormalizerOptions} from "../normalizer-options/lowercase-normalizer.options";
import {BaseNormalizer} from "./base.normalizer";

export class LowercaseNormalizer extends BaseNormalizer<LowercaseNormalizerOptions> implements DataNormalizerInterface<string, LowercaseNormalizerOptions>{
    getUniqueKey(): DataNormalizerUniqueKey {
        return LowercaseNormalizer.name;
    }

    normalize(source: any, options?: LowercaseNormalizerOptions): string {
        options = this.getOptions(options);
        
        if(typeof source !== "string") {
            if(options && options.shouldThrowIfTypeIsNotString) {
                throw new NormalizerInvalidSourceTypeError("The 'LowercaseNormalizer' expects the source value to be of type 'string'. Type '" + typeof source+ "' was received.", this.getUniqueKey(), options, source, typeof source)
            }

            return source;
        }

        return source.toLowerCase();
    }
}