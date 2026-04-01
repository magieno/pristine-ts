/**
 * The result interface returned when pagination occurred for DynamoDb queries
 */
export interface PaginationResult {
  /**
   * The number of items returned in the page.
   */
  count: number,

  /**
   * The key of the last item returned in the page.
   */
  lastEvaluatedKey: any;
}
