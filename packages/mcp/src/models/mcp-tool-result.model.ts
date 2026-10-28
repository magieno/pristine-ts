import {McpContentInterface} from "../interfaces/mcp-content.interface";

/**
 * The result of a tool call, as `tools/call` returns it. A tool can return one to control the
 * content blocks; returning a string or a JSON value is enough for most tools.
 */
export class McpToolResult {
  public constructor(public readonly content: McpContentInterface[],
                     public readonly structuredContent?: unknown,
                     public readonly isError: boolean = false) {
  }

  /**
   * A result made of one text block.
   *
   * @param text The text.
   */
  public static text(text: string): McpToolResult {
    return new McpToolResult([{type: "text", text}]);
  }

  /**
   * A structured result. The value is also serialized in a text block, as the specification
   * recommends for clients that do not read `structuredContent`.
   *
   * @param value Any JSON value.
   */
  public static json(value: unknown): McpToolResult {
    return new McpToolResult([{type: "text", text: JSON.stringify(value)}], value);
  }

  /**
   * A tool execution error: the model reads the message and can retry differently.
   *
   * @param message The message.
   */
  public static error(message: string): McpToolResult {
    return new McpToolResult([{type: "text", text: message}], undefined, true);
  }
}
