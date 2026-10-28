import {PristineError} from "@pristine-ts/common";

/**
 * Throw it from a tool to report a failure the model can act on ("the note does not exist",
 * "the date must be in the future"). The message reaches the model as a tool execution error.
 *
 * Any other `PristineError` of kind `UserError` is reported the same way. Every other error is
 * logged and reported with a generic message, so internals never leak to the client.
 */
export class McpToolError extends PristineError {
  public constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: "MCP_TOOL_ERROR",
      details,
    });
  }
}
