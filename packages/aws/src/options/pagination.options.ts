import { DynamodbSortOrderEnum } from "../enums/dynamodb-sort-order.enum";

export interface PaginationOptions {
    pageSize?: number,
    startKey?: any,
    order?: DynamodbSortOrderEnum
}
