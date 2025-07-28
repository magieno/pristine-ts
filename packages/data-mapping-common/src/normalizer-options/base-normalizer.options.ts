export abstract class BaseNormalizerOptions {
  public shouldThrowIfTypeIsNotString: boolean = false;

  public constructor(options?: Partial<BaseNormalizerOptions>) {
    this.shouldThrowIfTypeIsNotString = options?.shouldThrowIfTypeIsNotString ?? this.shouldThrowIfTypeIsNotString;
  }
}