import {JsonSchemaInterface} from "./json-schema.interface";
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
