import {BreadcrumbModel} from "../models/breadcrumb.model";

/**
 * @deprecated Prefer the spans-based path going forward:
 *
 *   - For method-boundary entries (today's `:enter` / `:return` / `:error` style), use
 *     `@traced` or `runWithSpan` in `@pristine-ts/telemetry`. The framework's auto-spans
 *     and any user spans flow into the breadcrumb trail of error logs automatically.
 *   - For mid-method markers, use `TracingManager.addEventToCurrentSpan(message, attributes?)`.
 *     It pushes a `SpanEvent` onto the active span; the LogHandler interleaves them with
 *     spans by timestamp when rendering the trail.
 *
 * This interface and its implementation survive as a back-compat shim — existing code
 * that calls `breadcrumbHandler.add(...)` keeps working, and entries still appear in
 * trails alongside span-derived entries. The class will be removed in a future major.
 */
export interface BreadcrumbHandlerInterface {
  /**
   * The list of breadcrumbs that led to this point.
   */
  breadcrumbs: { [eventId in string]: BreadcrumbModel[] };

  /**
   * Adds a new breadcrumb to the trail. When `eventId` is omitted, the implementation
   * falls back to the active `EventContext.eventId` (if any).
   *
   * @deprecated Use `tracingManager.addEventToCurrentSpan(message, extra)` instead.
   */
  add(eventId: string | undefined, message: string, extra?: any): void;

  /**
   * Resets all the breadcrumbs for an event.
   */
  reset(eventId: string): void;
}
