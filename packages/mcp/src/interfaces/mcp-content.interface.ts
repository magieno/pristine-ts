/**
 * One content block of a tool result. `text` is the common case; images, audio and resource
 * links follow the same shape with their own fields.
 */
export interface McpContentInterface {
  type: "text" | "image" | "audio" | "resource_link" | "resource" | string;
  text?: string;

  [field: string]: unknown;
}
