/**
 * Hints that describe how a tool behaves. Clients treat them as untrusted unless they trust the
 * server, so they never replace an authorization check.
 */
export interface McpToolAnnotationsInterface {
  /**
   * A human-readable title for the tool.
   */
  title?: string;

  /**
   * True when the tool does not modify its environment.
   */
  readOnlyHint?: boolean;

  /**
   * True when the tool can perform destructive updates. Only meaningful when `readOnlyHint` is false.
   */
  destructiveHint?: boolean;

  /**
   * True when calling the tool again with the same arguments has no additional effect.
   */
  idempotentHint?: boolean;

  /**
   * True when the tool interacts with an open world of external entities (the web, for example).
   */
  openWorldHint?: boolean;
}
