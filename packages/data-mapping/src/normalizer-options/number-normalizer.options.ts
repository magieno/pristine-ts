export class NumberNormalizerOptions {
    /**
     * This property specifies whether an undefined value should be ignored and simply returned or treated as a potential string
     * and return an empty string `""`.
     */
    public ignoreUndefined?: boolean;

    public constructor(options?: NumberNormalizerOptions) {
        this.ignoreUndefined = options?.ignoreUndefined ?? true;
    }
}