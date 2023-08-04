export abstract class BaseNormalizerOptions {
    public shouldThrowIfTypeIsNotString?: boolean;

    public constructor(options: BaseNormalizerOptions) {
        this.shouldThrowIfTypeIsNotString = options.shouldThrowIfTypeIsNotString ?? false;
    }
}