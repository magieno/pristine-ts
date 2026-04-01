export class DateNormalizerOptions {
  /**
   * This property specifies whether an invalid date should return undefined or a date object.
   */
  public returnUndefinedOnInvalidDate: boolean = true;

  /**
   * This property specifies if a number should be treated as being in seconds or not. Since JS Date expects a
   * timestamp in milliseconds, if the number is in seconds, it will be multiplied by 1000.
   */
  public treatNumbers: "milliseconds" | "seconds" = "seconds";

  public constructor(options?: Partial<DateNormalizerOptions>) {
    this.returnUndefinedOnInvalidDate = options?.returnUndefinedOnInvalidDate ?? this.returnUndefinedOnInvalidDate;
    this.treatNumbers = options?.treatNumbers ?? this.treatNumbers;
  }
}