import {JsonSchemaInterface} from "./json-schema.interface";

/**
 * The options of the `@mcpToolParameter` decorator.
 */
export interface McpToolParameterOptionsInterface {
  /**
   * What the parameter means. The model reads this to fill the argument, so be precise.
   */
  description?: string;

  /**
   * A short human-readable name.
   */
  title?: string;

  /**
   * Example values.
   */
  examples?: unknown[];

  /**
   * The value the tool uses when the argument is absent. Informational only: the tool still has
   * to apply it.
   */
  default?: unknown;

  /**
   * Keywords merged last into the generated schema of this property. Use it for what validation
   * metadata cannot express, such as the item type of an array of primitives.
   */
  schema?: JsonSchemaInterface;
}
