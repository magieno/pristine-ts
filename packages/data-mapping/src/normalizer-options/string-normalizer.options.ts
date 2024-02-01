export class StringNormalizerOptions {
    /**
     * This property specifies whether an undefined value should be ignored and simply returned or treated as a potential string
     * and return an empty string `""`.
     */
    public ignoreUndefined: boolean = true;

    /**
     * This represents the format of the date that the normalizer should use when outputting a date object to a string.
     */
    public dateFormat?: string;

    public constructor(options?: Partial<StringNormalizerOptions>) {
        this.ignoreUndefined = options?.ignoreUndefined ?? this.ignoreUndefined;
        this.dateFormat = options?.dateFormat;
    }
}