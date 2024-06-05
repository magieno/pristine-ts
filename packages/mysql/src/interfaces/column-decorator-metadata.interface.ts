export interface ColumnDecoratorMetadataInterface {
    name?: string;

    isPrimaryKey?: boolean;

    /**
     * Whether or not the column should be included in the search.
     *
     * Default: `true`
     */
    isSearchable?: boolean;
}
