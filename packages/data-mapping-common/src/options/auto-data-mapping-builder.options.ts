export class AutoDataMappingBuilderOptions {
    /**
     * This property is used to specify the default value for the `ìsOptional` property in the builder.
     *
     * It will not override the `isNullable` metadata for the property.
     *
     * Default value is `false`.
     */
    isOptionalDefaultValue: boolean;

    constructor(options?: Partial<AutoDataMappingBuilderOptions>) {
        this.isOptionalDefaultValue = options?.isOptionalDefaultValue ?? false;
    }
}