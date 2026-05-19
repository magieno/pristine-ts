import {AsyncLocalStorage} from "async_hooks";
import {DependencyContainer, injectable} from "tsyringe";
import {EventContext} from "../contexts/event-context";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";

/**
 * Owns the `AsyncLocalStorage` instance that propagates the active `EventContext`
 * across `await` boundaries, `Promise.all`, `setImmediate`, and the rest of Node's
 * async machinery. Provides:
 *
 *   - `run(ctx, fn)` — install the context for the duration of `fn`. **Framework-only**;
 *     normal application code never calls this. Pristine's event pipeline calls it once
 *     per event.
 *   - Read accessors — `current()`, `eventId()`, `traceId()`, `container()`. Available
 *     as instance methods (DI-resolved) and as static convenience methods.
 *   - `bind(fn)` — escape hatch for background work that breaks the natural async
 *     chain (raw `setImmediate`, `EventEmitter`-based code, certain native modules).
 *     Captures the current context and returns a wrapped function that restores it
 *     on call.
 *
 * Why static state inside an `@injectable()` class: the `AsyncLocalStorage` instance
 * itself must be a single process-wide singleton — multiple instances would each track
 * their own propagation chain and contexts wouldn't be visible across them. Making the
 * ALS `private static readonly` while keeping the class `@injectable()` lets DI consumers
 * resolve it normally (and substitute fakes in tests) while the underlying state stays
 * shared and consistent.
 */
@injectable()
export class EventContextManager {
  private static readonly als = new AsyncLocalStorage<EventContext>();

  /**
   * Installs `ctx` as the active `EventContext` for the duration of `fn` (and every
   * async chain reachable from it). Returns whatever `fn` returns. Used by Pristine's
   * event pipeline; application code shouldn't need to call this directly.
   */
  run<T>(ctx: EventContext, fn: () => T): T;
  run<T>(ctx: EventContext, fn: () => Promise<T>): Promise<T>;
  run<T>(ctx: EventContext, fn: () => T | Promise<T>): T | Promise<T> {
    return EventContextManager.als.run(ctx, fn);
  }

  /** Returns the active `EventContext`, or `undefined` if no context is installed
   *  (i.e. we're outside any `run()` call). */
  current(): EventContext | undefined {
    return EventContextManager.als.getStore();
  }

  /** Convenience: the `eventId` of the active context, or `undefined`. */
  eventId(): string | undefined {
    return this.current()?.eventId;
  }

  /** Convenience: the `traceId` of the active context, or `undefined`. */
  traceId(): string | undefined {
    return this.current()?.traceId;
  }

  /** Convenience: the per-event DI child container, or `undefined`. */
  container(): DependencyContainer | undefined {
    return this.current()?.container;
  }

  /** Convenience: the `TracingManager` that owns this event's trace, or `undefined`. */
  tracingManager(): TracingManagerInterface | undefined {
    return this.current()?.tracingManager;
  }

  /**
   * Returns a wrapped version of `fn` that restores the current context on call. Use
   * when you need to spawn work that escapes the natural async chain (e.g. a callback
   * registered with a third-party `EventEmitter`, or a `setImmediate` whose callback
   * runs after the parent function returned). Without `bind`, that work would see no
   * context.
   *
   * If no context is active when `bind` is called, returns `fn` unchanged.
   */
  bind<F extends (...args: any[]) => any>(fn: F): F {
    const ctx = this.current();
    if (ctx === undefined) return fn;
    const als = EventContextManager.als;
    return ((...args: any[]) => als.run(ctx, () => fn(...args))) as F;
  }

  // ── Static convenience mirrors. ────────────────────────────────────────────────
  // For callers that don't want DI noise (e.g. utility code, decorators, helpers
  // that don't have a constructor to inject through). All forwarding to the same
  // shared ALS instance.

  static current(): EventContext | undefined {
    return EventContextManager.als.getStore();
  }

  static eventId(): string | undefined {
    return EventContextManager.current()?.eventId;
  }

  static traceId(): string | undefined {
    return EventContextManager.current()?.traceId;
  }

  static container(): DependencyContainer | undefined {
    return EventContextManager.current()?.container;
  }

  static tracingManager(): TracingManagerInterface | undefined {
    return EventContextManager.current()?.tracingManager;
  }

  static bind<F extends (...args: any[]) => any>(fn: F): F {
    const ctx = EventContextManager.current();
    if (ctx === undefined) return fn;
    const als = EventContextManager.als;
    return ((...args: any[]) => als.run(ctx, () => fn(...args))) as F;
  }
}
