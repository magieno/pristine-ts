export class NumberNormalizerOptions {
    /**
     * This property specifies whether an undefined value should be ignored and simply returned or treated as a potential string
     * and return an empty string `""`.
     */
    public ignoreUndefined: boolean = true;

    public constructor(options?: Partial<NumberNormalizerOptions>) {
        this.ignoreUndefined = options?.ignoreUndefined ?? this.ignoreUndefined;
    }
}