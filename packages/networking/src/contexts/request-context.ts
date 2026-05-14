import {IdentityInterface, Request} from "@pristine-ts/common";
import {MethodRouterNode} from "../nodes/method-router.node";

/**
 * Per-HTTP-request state, scoped to the lifetime of one routed request. Layered
 * **inside** the framework's `EventContext` (which holds `eventId`/`traceId`/`container`):
 * a controller method running inside an HTTP request can read both the EventContext
 * primitives and these networking-specific slots.
 *
 * Owned by `@pristine-ts/networking`. Apps that don't import the networking module
 * never see this type — `Request`, `MethodRouterNode`, and `IdentityInterface` are
 * concerns of HTTP-shaped flows, not of the framework as a whole.
 *
 * Populated incrementally as the router progresses through the request lifecycle:
 *   - `request` is set the moment the context is installed (route matching has
 *     succeeded by then; a 404 short-circuits before installation).
 *   - `methodNode` is set immediately after request (always together).
 *   - `identity` fills in once the authentication pipeline runs. Until then,
 *     downstream code that reads `identity` from the context sees `undefined`.
 */
export class RequestContext {
  request!: Request;
  methodNode?: MethodRouterNode;
  identity?: IdentityInterface;
}
