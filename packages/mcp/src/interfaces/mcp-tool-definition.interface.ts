import {JsonSchemaInterface} from "@pristine-ts/class-validator";
import {McpToolAnnotationsInterface} from "./mcp-tool-annotations.interface";

/**
 * A tool as `tools/list` sends it to the client.
 */
export interface McpToolDefinitionInterface {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchemaInterface;
  annotations?: McpToolAnnotationsInterface;
}
