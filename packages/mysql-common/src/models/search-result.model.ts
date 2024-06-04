import {property} from "@pristine-ts/metadata";

export class SearchResult<T extends { [key: string]: any; }> {
    @property()
    page: number = 1;

    @property()
    numberOfResultsReturned: number = 0;

    @property()
    totalNumberOfResults: number = 0;

    @property()
    maximumNumberOfResultsPerPage: number = 0;

    @property()
    results: T[] = [];
}
