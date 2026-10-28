/**
 * A JSON-RPC 2.0 request (with an `id`) or notification (without one), as received.
 */
export interface JsonRpcMessageInterface {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: { [key: string]: any };
}
