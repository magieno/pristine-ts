/**
 * The JSON-RPC 2.0 error codes, and the codes MCP reserves in `-32020..-32099`.
 */
export enum JsonRpcErrorCodeEnum {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  HeaderMismatch = -32020,
  MissingRequiredClientCapability = -32021,
  UnsupportedProtocolVersion = -32022,
}
