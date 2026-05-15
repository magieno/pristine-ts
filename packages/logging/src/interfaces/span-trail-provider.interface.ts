import {BreadcrumbModel} from "../models/breadcrumb.model";

/**
 * Adapter interface that lets the LogHandler ask "what does the active trace look like
 * as a flat trail of breadcrumb-shaped entries?" without depending on the telemetry
 * package directly.
 *
 * Implemented by `TracingManager` in `@pristine-ts/telemetry`. Telemetry depends on
 * logging (this direction is fine and already exists), so the implementation can
 * reach back into `BreadcrumbModel`. Logging stays unaware of telemetry's shape.
 *
 * Tagged as `"SpanTrailProviderInterface"` for DI lookup. The LogHandler resolves it
 * lazily at log time via `EventContextManager.container()` — so when the telemetry
 * module isn't part of the app, the LogHandler simply doesn't find a provider and
 * falls back to the manual `BreadcrumbHandler` entries alone.
 */
export interface SpanTrailProviderInterface {
  /**
   * Returns the active trace's spans (and their attached span events) as a flat,
   * timestamp-sorted list of `BreadcrumbModel` entries. Returns `[]` when no trace
   * is active, when the trace has no root span, or when the implementation chooses
   * not to expose its state.
   *
   * Each entry's `message` is the span's keyname (with an `(active)` suffix for
   * still-open spans) or the event's message. The `extra` field carries the entry's
   * `kind` discriminator (`"span"` / `"event"`) plus any span / event attributes,
   * so renderers can distinguish them when rendering nested or styled output.
   */
  getCurrentTrail(): BreadcrumbModel[];
}
