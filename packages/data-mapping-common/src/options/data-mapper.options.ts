export class DataMapperOptions {
    /**
     * This property specifies if extraneous properties should be excluded from the value when converting a plain value to a class.
     *
     * Default value is `false`.
     */
    excludeExtraneousValues: boolean;

    constructor(options?: Partial<DataMapperOptions>) {
        this.excludeExtraneousValues = options?.excludeExtraneousValues ?? false;
    }
}