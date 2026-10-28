/**
 * The `error` member of a JSON-RPC 2.0 error response.
 */
export interface JsonRpcErrorInterface {
  code: number;
  message: string;
  data?: unknown;
}
