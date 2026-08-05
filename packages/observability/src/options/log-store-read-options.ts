/**
 * Options for `LogStore.read`.
 */
export interface LogStoreReadOptions {
  /**
   * Maximum number of entries to return, counted from the newest. Omitted means "every
   * matching entry" — on a large store that materializes the whole thing, so callers
   * that render to a terminal should pass a limit.
   */
  limit?: number;
}
