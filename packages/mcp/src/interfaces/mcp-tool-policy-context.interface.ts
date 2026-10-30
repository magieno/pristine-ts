import {IdentityInterface} from "@pristine-ts/common";
import {McpImplementationInterface} from "./mcp-implementation.interface";

/**
 * What a tool policy knows about the request it decides on.
 */
export interface McpToolPolicyContextInterface {
  /**
   * The caller, when the transport authenticated it.
   */
  identity?: IdentityInterface;

  /**
   * The client, as it describes itself. Self-reported: never use it for a security decision.
   */
  clientInfo?: McpImplementationInterface;
}
