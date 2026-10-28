import {IdentityInterface} from "@pristine-ts/common";
import {McpImplementationInterface} from "./mcp-implementation.interface";

/**
 * What a tool method receives as its second argument.
 */
export interface McpToolContextInterface {
  /**
   * The caller, when the transport authenticated it (for example through the `@identity()` of
   * the controller that serves MCP over HTTP).
   */
  identity?: IdentityInterface;

  /**
   * Aborted when the client cancels the call. Pass it to long-running work.
   */
  signal: AbortSignal;

  /**
   * The protocol version the request speaks.
   */
  protocolVersion: string;

  /**
   * The client, as it describes itself. Self-reported: never use it for a security decision.
   */
  clientInfo?: McpImplementationInterface;
}
