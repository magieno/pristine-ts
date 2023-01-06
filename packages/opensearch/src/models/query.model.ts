import {SortQuery} from "./sort-query.model";
import {Aggregation} from "./aggregation.model";
import {Range} from "./range.model";

export class Query {
    /**
     * "sort": [
     *       {
     *      "priority": {
     *        "order": "asc"
     *      }
     *    }
     * ]
     */
    sort: {[key: string]: SortQuery}[] = [];
    excludeFieldsFromResponse: string[] = [];
    fields: string[] = [];
    conditions: {[key: string]: string | number | boolean}[] = [];
    page?: number;
    maximumNumberOfResultsPerPage: number = 50;
    query?: string;
    aggregation?: Aggregation;
    searchType?: "multi_match" | "query_string";
    searchOperator?: "and" | "or";
    /**
     * {
     *    range: {
     *      fieldName: {
     *        gte: 5,
     *        lte: 10
     *      }
     *    }
     * }
     */
    range?: {[key: string]: Range};
}
