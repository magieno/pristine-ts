/**
 * The HTTP headers of the Streamable HTTP transport, in lower case as `Request.getHeader` reads them.
 */
export enum McpHttpHeaderEnum {
  Origin = "origin",
  ProtocolVersion = "mcp-protocol-version",
  Method = "mcp-method",
  Name = "mcp-name",
}
