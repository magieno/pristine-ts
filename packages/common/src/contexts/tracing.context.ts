import "reflect-metadata";
import {injectable, Lifecycle, scoped} from "tsyringe";

/**
 * @deprecated Read the trace id from the active `EventContext` instead:
 *
 * ```ts
 * import {EventContextManager} from "@pristine-ts/common";
 *
 * const traceId = EventContextManager.traceId();
 * ```
 *
 * `TracingContext` predates the `AsyncLocalStorage`-backed `EventContext` and survives
 * only as a back-compat shim. `TracingManager.startTracing()` still mirrors the trace id
 * into this class so existing consumers keep working, but new code should read from
 * `EventContextManager`. This class will be removed in a future major.
 */
@injectable()
@scoped(Lifecycle.ContainerScoped)
export class TracingContext {
  public traceId?: string
}
