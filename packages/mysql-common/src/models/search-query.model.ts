import {SearchQueryField} from "./search-query-field.model";
import {SortOrderEnum} from "../enums/sort-order.enum";
import {SearchQueryParametersInterface} from "../interfaces/search-query-parameters.interface";

export class SearchQuery {
    /**
     * The list of fields on which actions or conditions will happen
     */
    fields: SearchQueryField[] = [];

    /**
     * The page number to retrieve.
     */
    page: number;

    /**
     * The maximum number of results per page to return.
     *
     * Default: `100`
     */
    maximumNumberOfResultsPerPage: number;

    /**
     * The query to search for.
     */
    query?: string;

    constructor(options?: Partial<SearchQuery>) {
        this.fields = options?.fields ?? [];
        this.page = options?.page ?? 1;
        this.maximumNumberOfResultsPerPage = options?.maximumNumberOfResultsPerPage ?? 100;
        this.query = options?.query ?? undefined;
    }


    /**
     * This method returns the field by its name or undefined if not found.
     * @param fieldName
     */
    getField(fieldName: string): SearchQueryField | undefined {
        return this.fields.find((field) => field.field === fieldName);
    }

    clearSort(field: string) {
        const fieldToClear = this.getField(field);

        if(fieldToClear === undefined) {
            return;
        }

        fieldToClear.order = undefined;
    }

    toggleSort(fieldName: string): SortOrderEnum {
        const field = this.getField(fieldName);

        if(field === undefined) {
            this.fields.push(new SearchQueryField(fieldName, {order: SortOrderEnum.Ascending}));
            return SortOrderEnum.Ascending;
        }

        const newSort: SortOrderEnum = field.order === SortOrderEnum.Descending ? SortOrderEnum.Ascending : SortOrderEnum.Descending;

        field.order = newSort;

        return newSort;
    }

    setSort(fieldName: string, order: SortOrderEnum) {
        const field = this.getField(fieldName);

        if(field === undefined) {
            this.fields.push(new SearchQueryField(fieldName, {order}));
            return;
        }

        field.order = order;
    }

    getSortedFields(): {field: string; order: SortOrderEnum}[]{
        return this.fields
            .filter((field) => field.order !== undefined)
            .map((field) => ({field: field.field, order: field.order as SortOrderEnum}));
    }

    /**
     * This method imports the query parameters from the query string and sets the properties of the model accordingly.
     * @param queryStrings
     */
    importQueryParameters(queryStrings: SearchQueryParametersInterface) {
        if (!queryStrings) {
            queryStrings = {};
        }

        this.query = queryStrings.query ?? this.query;
        this.page = queryStrings.page ?? this.page;
        this.maximumNumberOfResultsPerPage = queryStrings.maximumNumberOfResultsPerPage ?? this.maximumNumberOfResultsPerPage;
        if(queryStrings.fields) {
            this.fields = queryStrings.fields?.split(",").map((field) => new SearchQueryField(field, {includeExplicitly: true})) ?? this.fields;
        }

        if(queryStrings.sort) {
            queryStrings.sort?.split(",").forEach((sortField) => {
                const [fieldName, order] = sortField.split(":");

                // Validate that the order is either "asc" or "desc"
                if (order !== "asc" && order !== "desc") {
                    throw new Error(`The order ${order} is not a valid order. It must be either "asc" or "desc".`);
                }

                const field = this.getField(fieldName);

                if(field !== undefined) {
                    field.order = order as SortOrderEnum;
                    return;
                }

                this.fields.push(new SearchQueryField(fieldName, {order: order as SortOrderEnum}));
            });
        }

        if(queryStrings.excludeFieldsFromResponse) {
            queryStrings.excludeFieldsFromResponse?.split(",").forEach((fieldName) => {
                const field = this.getField(fieldName);

                if(field !== undefined) {
                    field.exclude = true;
                    return;
                }

                this.fields.push(new SearchQueryField(fieldName, {exclude: true}));
            });
        }
    }

    /**
     * This method exports the query parameters to a query string.
     */
    exportQueryParameters(): SearchQueryParametersInterface {
        return {
            query: this.query,
            page: this.page,
            maximumNumberOfResultsPerPage: this.maximumNumberOfResultsPerPage,
            excludeFieldsFromResponse: this.fields.filter((field) => field.exclude).map((field) => field.field).join(","),
            fields: this.fields.filter((field) => field.includeExplicitly).map((field) => field.field).join(","),
            sort: this.fields.filter((field) => field.order !== undefined).map((field) => `${field.field}:${field.order}`).join(","),
        };
    }
}
