import {DependencyContainer} from "tsyringe";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {Trace} from "../models/trace.model";

/**
 * Per-event runtime state — the framework's correlation primitives plus a handle to
 * the per-event DI child container and the active trace. Propagated implicitly via
 * `AsyncLocalStorage` (managed by `EventContextManager`) so downstream code doesn't
 * have to thread these fields through every method signature.
 *
 * **Not to be confused with `ExecutionContextInterface` (in `@pristine-ts/core`):**
 *   - `ExecutionContext` describes *where* the framework is running (AWS Lambda, CLI,
 *     Express, etc.) — set once per `kernel.handle()` call, immutable, host-shaped.
 *   - `EventContext` describes *which specific event* is being handled — set per event
 *     in the pipeline, mutable (`traceId` / `trace` fill in once tracing starts),
 *     correlation-shaped.
 *
 * One `kernel.handle()` call can produce multiple events (each event mapper can return
 * a list); each event gets its own `EventContext` instance.
 */
export class EventContext {
  /** Unique id for this specific event. Same value the framework uses everywhere
   *  else as the correlation/eventId (logging, file tracer filenames). */
  eventId!: string;

  /** Trace id once tracing has started. Filled in by `TracingManager.startTracing`. */
  traceId?: string;

  /** The active `Trace` for this event. Single source of truth: every `TracingManager`
   *  instance — whether resolved from the root container, a per-event child container,
   *  or anywhere else — reads and writes spans through this reference. This is what
   *  lets `addMarkerToCurrentSpan` from a controller find the same trace started in the
   *  kernel, even though the TracingManager instances differ across containers. */
  trace?: Trace;

  /** The per-event DI child container. Helpers like the LogHandler eventId fallback
   *  reach through this to resolve event-scoped services without callers having to
   *  inject them explicitly. */
  container?: DependencyContainer;

  /** The `TracingManager` that owns this event's trace. Set by the event pipeline
   *  alongside `trace`, read by `@traced` so spans go through the manager that started
   *  the trace rather than a fresh ContainerScoped instance from the child container.
   *  Resolving `TracingManager` via the child container would create a new instance
   *  (its lifecycle is ContainerScoped) whose `span.tracingManager = this` back-reference
   *  points at the throwaway, not the manager that owns the trace. */
  tracingManager?: TracingManagerInterface;
}
