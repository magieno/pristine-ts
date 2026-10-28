import {ConfigError} from "@pristine-ts/common";

/**
 * Thrown when the declared tools cannot form a valid catalog: an invalid or duplicated name, or an
 * input property whose type cannot be expressed as JSON Schema. It is a programming error, so it
 * surfaces when the catalog is first built, not on a tool call.
 */
export class McpToolDeclarationError extends ConfigError {
  public constructor(message: string, details?: Record<string, unknown>, cause?: Error) {
    super(message, {
      code: "MCP_TOOL_DECLARATION_INVALID",
      details,
      cause,
    });
  }
}
