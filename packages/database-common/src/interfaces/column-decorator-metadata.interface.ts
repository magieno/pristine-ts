export interface ColumnDecoratorMetadataInterface {
  name?: string;

  isPrimaryKey?: boolean;

  /**
   * Whether or not the column should be included in the search.
   *
   * Default: `true`
   */
  isSearchable?: boolean;

  /**
   * Whether this column should be treated as a JSON blob.
   */
  isJsonBlob?: boolean;
}
