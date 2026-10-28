import {JsonRpcErrorInterface} from "./json-rpc-error.interface";

/**
 * A JSON-RPC 2.0 response: either a `result` or an `error`. The `id` is absent only when the
 * request was too malformed to read it.
 */
export interface JsonRpcResponseInterface {
  jsonrpc: "2.0";
  id?: string | number;
  result?: { [key: string]: unknown };
  error?: JsonRpcErrorInterface;
}
