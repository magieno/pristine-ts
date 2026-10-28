/**
 * How a request speaks MCP: with per-request `_meta` (modern) or after an `initialize` handshake
 * (legacy). The era decides the shape of results and the HTTP status of errors.
 */
export enum McpProtocolEraEnum {
  Modern = "modern",
  Legacy = "legacy",
}
