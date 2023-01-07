import {SearchResultAggregation} from "./search-result-aggregation.model";

export class SearchResult<T> {
    total: number = 0;
    numberOfReturnedResults: number = 0;
    results: T[] = [];
    maximumNumberOfResultsPerPage: number = 50;
    currentPage: number = 1;
    aggregations: SearchResultAggregation[] = []
}
