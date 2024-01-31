export class DateNormalizerOptions {
    /**
     * This property specifies whether an invalid date should return undefined or a date object.
     */
    public returnUndefinedOnInvalidDate?: boolean;

    /**
     * This property specifies if a number should be treated as being in seconds or not. Since JS Date expects a
     * timestamp in milliseconds, if the number is in seconds, it will be multiplied by 1000.
     */
    public treatNumbers?: "milliseconds" | "seconds";

    public constructor(options?: DateNormalizerOptions) {
        this.returnUndefinedOnInvalidDate = options?.returnUndefinedOnInvalidDate ?? true;
        this.treatNumbers = options?.treatNumbers ?? "seconds";
    }
}