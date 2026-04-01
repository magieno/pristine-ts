import {SearchResultAggregation} from "./search-result-aggregation.model";
import {SearchResultHit} from "./search-result-hit.model";

export class SearchResult<T> {
  total: number = 0;
  numberOfReturnedResults: number = 0;
  hits: SearchResultHit<T>[] = [];
  maximumNumberOfResultsPerPage: number = 50;
  currentPage: number = 1;
  aggregations: SearchResultAggregation[] = []
}
