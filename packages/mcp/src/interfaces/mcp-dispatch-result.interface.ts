import {JsonRpcResponseInterface} from "./json-rpc-response.interface";

/**
 * What the dispatcher returns for one message.
 */
export interface McpDispatchResultInterface {
  /**
   * The response to send back. Absent for a notification.
   */
  response?: JsonRpcResponseInterface;

  /**
   * The HTTP status the Streamable HTTP transport must use. Other transports ignore it.
   */
  httpStatus: number;
}
