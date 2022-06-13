import { DynamodbSortOrderEnum } from "../enums/dynamodb-sort-order.enum";

/**
 * Pagination options for Dynamodb queries.
 */
export interface PaginationOptions {
    /**
     * The number of items per page to return.
     * If not specified, returns all the items.
     */
    pageSize?: number,

    /**
     * The key where to start the new page.
     * If not specified, starts at the first item.
     */
    startKey?: any,

    /**
     * The order in which to list the items.
     * By default, DESC, meaning the most recent item comes first.
     */
    order?: DynamodbSortOrderEnum
}
