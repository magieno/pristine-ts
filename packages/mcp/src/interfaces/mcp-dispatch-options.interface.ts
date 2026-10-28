import {DependencyContainer} from "tsyringe";
import {IdentityInterface} from "@pristine-ts/common";

/**
 * What a transport passes to the dispatcher with each message.
 */
export interface McpDispatchOptionsInterface {
  /**
   * The container the tool classes are resolved from: the child container of the current event.
   */
  container: DependencyContainer;

  /**
   * The authenticated caller, if any.
   */
  identity?: IdentityInterface;

  /**
   * Aborted when the client cancels the request.
   */
  signal?: AbortSignal;

  /**
   * The protocol version of a legacy request, when the transport knows it (the HTTP
   * `MCP-Protocol-Version` header). Modern requests carry their own in `_meta`.
   */
  legacyProtocolVersion?: string;
}
