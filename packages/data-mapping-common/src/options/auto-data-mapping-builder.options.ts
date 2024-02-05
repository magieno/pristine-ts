export class AutoDataMappingBuilderOptions {
    /**
     * This property is used to specify the default value for the `ìsOptional` property in the builder.
     *
     * It will not override the `isNullable` metadata for the property.
     *
     * Default value is `true`.
     */
    isOptionalDefaultValue: boolean;

    /**
     * This property specifies if extraneous properties should be excluded from the value when converting a plain value to a class.
     *
     * Default value is `false`.
     */
    excludeExtraneousValues: boolean;

    constructor(options?: Partial<AutoDataMappingBuilderOptions>) {
        this.isOptionalDefaultValue = options?.isOptionalDefaultValue ?? true;
        this.excludeExtraneousValues = options?.excludeExtraneousValues ?? false;
    }
}