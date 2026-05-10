/**
 * Plain-data shape of an `Error` captured during instantiation. The original `Error` instance
 * is not retained because the report it lives in is meant to be JSON-serializable (logged,
 * sent over the wire, persisted) — and a thrown `Error` does not survive serialization
 * round-trips with name/message/stack intact.
 */
export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
}
