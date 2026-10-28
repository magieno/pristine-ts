import {ClassConstructor} from "class-transformer";
import {McpToolAnnotationsInterface} from "./mcp-tool-annotations.interface";

/**
 * The options of the `@mcpTool` decorator.
 */
export interface McpToolOptionsInterface {
  /**
   * The unique name of the tool. 1 to 128 characters: ASCII letters, digits, `_`, `-` and `.`.
   */
  name: string;

  /**
   * A human-readable name for display purposes.
   */
  title?: string;

  /**
   * What the tool does. The model reads this to decide when to call the tool, so be precise.
   */
  description: string;

  /**
   * The class that describes the arguments. Its `@pristine-ts/class-validator` decorators become
   * the tool's `inputSchema` and validate every call. Omit it for a tool without arguments.
   */
  inputType?: ClassConstructor<any>;

  /**
   * Behavior hints sent to the client.
   */
  annotations?: McpToolAnnotationsInterface;
}
