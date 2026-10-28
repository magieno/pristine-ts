/**
 * The reserved `_meta` keys this server reads or writes.
 */
export enum McpMetaKeyEnum {
  ProtocolVersion = "io.modelcontextprotocol/protocolVersion",
  ClientInfo = "io.modelcontextprotocol/clientInfo",
  ClientCapabilities = "io.modelcontextprotocol/clientCapabilities",
  ServerInfo = "io.modelcontextprotocol/serverInfo",
}
