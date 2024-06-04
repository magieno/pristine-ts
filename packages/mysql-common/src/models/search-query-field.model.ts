import {SortOrderEnum} from "../enums/sort-order.enum";

export class SearchQueryField {
    /**
     * This field represents the name of the field.
     */
    field: string;

    /**
     * This represents the sort order of the field.
     */
    order?: SortOrderEnum;

    /**
     * Exclude the field from the search results.
     *
     * Default value: `false`.
     */
    exclude: boolean;

    /*
     * READ CAREFULLY TO UNDERSTAND.
     *
     * Whether or not the field is explicitly defined in the search query. If it's set to false or undefined,
     * the field might still be considered in the search query if no other fields have this property set to true.
     *
     * Note: You cannot set this property to `false` to exclude it from the search query.
     */
    includeExplicitly?: boolean;

    constructor(field: string, options: Partial<SearchQueryField>) {
        this.field = field;
        this.exclude = options.exclude ?? false;
        this.order = options.order ?? undefined;
        this.includeExplicitly = options.includeExplicitly ?? undefined;
    }
}
