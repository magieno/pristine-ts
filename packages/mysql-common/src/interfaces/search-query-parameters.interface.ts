export interface SearchQueryParametersInterface {
    /**
     * The query to search for.
     */
    query?: string;

    /**
     * Comma separated list of fields to consider in the search.
     *
     * If not specified, all fields will be considered.
     */
    fields?: string;

    /**
     * The page number to retrieve.
     */
    page?: number;

    /**
     * Comma separated list of field to consider in the search.
     */
    excludeFieldsFromResponse?: string;

    /**
     * The maximum number of results per page to return.
     */
    maximumNumberOfResultsPerPage?: number;

    /**
     * Separated by commas string of `field:asc|desc` to sort the results.
     */
    sort?: string;

    /**
     * Separated by commas string of `filter:field:operator:value` to filter the results.
     */
    filters?: string;
}
