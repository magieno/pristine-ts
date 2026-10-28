import {PristineError} from "@pristine-ts/common";
import {JsonRpcErrorCodeEnum} from "../enums/json-rpc-error-code.enum";

/**
 * A request the protocol layer refuses. The dispatcher turns it into a JSON-RPC error response;
 * it never reaches a tool.
 */
export class McpProtocolError extends PristineError {
  /**
   * @param jsonRpcCode The JSON-RPC error code.
   * @param message The message sent to the client.
   * @param httpStatus The HTTP status for a modern request on the Streamable HTTP transport.
   * @param data The `data` member of the error, if any.
   */
  public constructor(public readonly jsonRpcCode: JsonRpcErrorCodeEnum,
                     message: string,
                     httpStatus: number = 400,
                     public readonly data?: unknown) {
    super(message, {
      code: "MCP_PROTOCOL_ERROR",
      httpStatus,
      details: {jsonRpcCode, data},
    });
  }
}
