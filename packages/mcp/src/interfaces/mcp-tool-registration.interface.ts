import {McpToolOptionsInterface} from "./mcp-tool-options.interface";

/**
 * One method registered with `@mcpTool`.
 */
export interface McpToolRegistrationInterface {
  /**
   * The class that owns the method. It is resolved from the container on every call, so it must
   * be `@injectable()`.
   */
  classConstructor: Function;

  /**
   * The name of the method to call.
   */
  methodKeyname: string;

  /**
   * The options given to the decorator.
   */
  options: McpToolOptionsInterface;
}
