import {McpProtocolVersionEnum} from "./enums/mcp-protocol-version.enum";

/**
 * The protocol versions this server accepts, grouped by era, newest first.
 */
export const McpProtocolVersions = {
  Modern: [McpProtocolVersionEnum.V2026_07_28] as string[],
  Legacy: [McpProtocolVersionEnum.V2025_11_25, McpProtocolVersionEnum.V2025_06_18, McpProtocolVersionEnum.V2025_03_26] as string[],
  /**
   * The version a legacy HTTP request without an `MCP-Protocol-Version` header is assumed to speak.
   */
  LegacyDefault: McpProtocolVersionEnum.V2025_03_26 as string,
  All: [
    McpProtocolVersionEnum.V2026_07_28,
    McpProtocolVersionEnum.V2025_11_25,
    McpProtocolVersionEnum.V2025_06_18,
    McpProtocolVersionEnum.V2025_03_26,
  ] as string[],
} as const;
