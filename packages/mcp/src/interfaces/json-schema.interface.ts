/**
 * A JSON Schema (2020-12) document, typed loosely on purpose: MCP sends it to the client as is,
 * and this package only writes the keywords it can derive from validation metadata.
 */
export interface JsonSchemaInterface {
  $schema?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: { [property: string]: JsonSchemaInterface };
  required?: string[];
  additionalProperties?: boolean | JsonSchemaInterface;
  items?: JsonSchemaInterface;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  default?: unknown;
  examples?: unknown[];

  [keyword: string]: unknown;
}
