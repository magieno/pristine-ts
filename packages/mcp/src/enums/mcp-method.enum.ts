/**
 * The JSON-RPC methods this server handles.
 */
export enum McpMethodEnum {
  Initialize = "initialize",
  ServerDiscover = "server/discover",
  Ping = "ping",
  ToolsList = "tools/list",
  ToolsCall = "tools/call",
  NotificationsInitialized = "notifications/initialized",
  NotificationsCancelled = "notifications/cancelled",
}
