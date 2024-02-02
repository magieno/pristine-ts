import {BaseNormalizerOptions} from "./base-normalizer.options";

export class LowercaseNormalizerOptions extends BaseNormalizerOptions {
    public constructor(options?: Partial<LowercaseNormalizerOptions>) {
        super(options);
    }
}