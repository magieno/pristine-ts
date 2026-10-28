/**
 * The MCP revisions this server speaks.
 *
 * `2026-07-28` is "modern": every request carries its version in `_meta`, and there is no
 * handshake. The older revisions are "legacy": the client opens with `initialize`.
 */
export enum McpProtocolVersionEnum {
  V2026_07_28 = "2026-07-28",
  V2025_11_25 = "2025-11-25",
  V2025_06_18 = "2025-06-18",
  V2025_03_26 = "2025-03-26",
}
