import {inject, injectable, injectAll, Lifecycle, scoped} from "tsyringe";
import {TelemetryConfigurationKeys} from "../telemetry.configuration-keys";
import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";
import {TracingManagerInterface} from "../interfaces/tracing-manager.interface";
import {EventContextManager, injectConfig, moduleScoped, ServiceDefinitionTagEnum, tag, TracingContext} from "@pristine-ts/common";
import {SpanKeynameEnum} from "../enums/span-keyname.enum";
import {TelemetryModuleKeyname} from "../telemetry.module.keyname";
import {TracerInterface} from "../interfaces/tracer.interface";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {SpanMarker} from "../models/span-marker.model";

/**
 * The Tracing Manager provides methods to help with tracing.
 * It is tagged and can be injected using TracingManagerInterface which facilitates mocking.
 * It is module scoped to the TelemetryModuleKeyname.
 *
 * **Where the active `Trace` lives.** The active trace is stored on `EventContext.trace`,
 * propagated via `AsyncLocalStorage`. Every `TracingManager` instance — whether resolved
 * from the root container (kernel boot) or from a per-event child container — reads and
 * writes spans through the same `EventContext.trace` reference, so a span started in the
 * kernel and an event added in a controller belong to the same trace tree.
 *
 * **Fallback `this.trace`.** During kernel boot (`Kernel.start()` and friends), there is
 * no `EventContext` yet — the framework hasn't started handling an event. In that window
 * the manager falls back to `this.trace`. This is the only time `this.trace` is touched.
 *
 * **Lifecycle: container-scoped, not singleton.** Each per-event DI child container gets
 * its own `TracingManager` instance. The per-instance `this.trace` fallback is what keeps
 * parallel events isolated *if* tracing is somehow started outside an EventContext.
 * Resolving `TracingManager` from the root container returns the root instance (used for
 * kernel-initialization spans); resolving from a child container returns the per-event
 * instance — both will agree on what trace is active inside an event because they read
 * from EventContext.
 */
@moduleScoped(TelemetryModuleKeyname)
@tag("TracingManagerInterface")
@scoped(Lifecycle.ContainerScoped)
@injectable()
export class TracingManager implements TracingManagerInterface {
  /**
   * Fallback trace used only during kernel boot when no `EventContext` is active.
   * Inside an event, the active trace lives on `EventContext.trace` instead.
   */
  public trace?: Trace

  /**
   * The Tracing Manager provides methods to help with tracing.
   * It is tagged and can be injected using TracingManagerInterface which facilitates mocking.
   * It is module scoped to the TelemetryModuleKeyname.
   * @param tracers The tracers to use. All services tagged with ServiceDefinitionTagEnum.Tracer will be injected here.
   * @param loghandler The log handler to output logs.
   * @param isActive Whether or not tracing is activated.
   * @param debug Whether or not tracing is in debug mode, meaning that it should output logs with the debug severity about the trace and spans.
   * This can be set to false to prevent having to much logs for every single span created.
   * @param tracingContext The tracing context.
   */
  public constructor(@injectAll(ServiceDefinitionTagEnum.Tracer, {isOptional: true}) private readonly tracers: TracerInterface[],
                     @inject("LogHandlerInterface") private readonly loghandler: LogHandlerInterface,
                     @injectConfig(TelemetryConfigurationKeys.Active) private readonly isActive: boolean,
                     @injectConfig(TelemetryConfigurationKeys.Debug) private readonly debug: boolean,
                     private readonly tracingContext: TracingContext,) {
  }

  /**
   * Returns the currently active trace from the EventContext, falling back to the
   * per-instance `this.trace` when no EventContext is active (kernel boot).
   */
  private getActiveTrace(): Trace | undefined {
    return EventContextManager.current()?.trace ?? this.trace;
  }

  /**
   * Stores `trace` as the active trace — on `EventContext.trace` when an event is active,
   * otherwise on the instance fallback `this.trace`.
   */
  private setActiveTrace(trace: Trace): void {
    const eventContext = EventContextManager.current();
    if (eventContext !== undefined) {
      eventContext.trace = trace;
    } else {
      this.trace = trace;
    }
  }

  /**
   * This methods starts the Tracing. This should be the first method called before doing anything else.
   * @param spanRootKeyname The keyname of the span at the root.
   * @param traceId The trace id if there is one.
   * @param context The context if there is one.
   */
  startTracing(spanRootKeyname: string = SpanKeynameEnum.RootExecution, traceId?: string, context?: {
    [key: string]: string
  }): Span {
    const trace = new Trace(traceId, context);
    this.setActiveTrace(trace);
    const span = new Span(spanRootKeyname, undefined, context);

    // Mirror the trace id into both the legacy `TracingContext` (back-compat for any
    // existing consumer that still injects it) and the new ALS-propagated `EventContext`
    // (the path forward; what `LogHandler` and other ALS-aware consumers will read).
    // Both writes are cheap; the dual write is just a transition aid until TracingContext
    // is fully removed in a later major.
    this.tracingContext.traceId = trace.id;
    const eventContext = EventContextManager.current();
    if (eventContext !== undefined) {
      eventContext.traceId = trace.id;
    }

    // If the tracing is not active, simply return the created span but don't send to the tracers.
    if (this.isActive === false) {
      return span;
    }

    // Log that we are starting the tracing
    if (this.debug) {
      this.loghandler.debug("Start Tracing", {
        spanRootKeyname,
        traceId,
        context,
        trace,
        span,
      })
    }

    // Call the tracers and push the trace that was just started
    this.tracers.forEach((tracer: TracerInterface) => {
      tracer.traceStartedStream?.push(trace);
    })

    // Define the rootSpan of the trace as the newly created Span. This is the root span.
    trace.rootSpan = span;

    // Call the addSpan method to ensure that the span will be added.
    this.addSpan(span);

    return span;
  }

  /**
   * This method starts a new span.
   * @param keyname The keyname for this new span.
   * @param parentKeyname The keyname of the parent span.
   * @param parentId The id of the parent span.
   * @param context The context if there is one.
   */
  public startSpan(keyname: string, parentKeyname?: string, parentId?: string, context?: { [key: string]: string }): Span {
    // Make sure a trace exists. `startTracing` is the canonical entry point, but a direct
    // `startSpan` call (e.g. from project code) should auto-start a trace rather than fail.
    let trace = this.getActiveTrace();
    if (trace === undefined) {
      this.startTracing(SpanKeynameEnum.RootExecution, undefined, context);
      trace = this.getActiveTrace();
    }

    // Construct the span. NOTE the third constructor argument: `Span(keyname, id?, context?)`.
    // A previous version of this code passed `context` in the `id` slot, which corrupted span
    // identities and broke parent-by-id lookup silently. Always pass `undefined`
    // for the id so a fresh UUID is generated, and put context in the third slot.
    const span = new Span(keyname, undefined, context);

    // Defensive: tracing must never throw. If the trace is somehow still undefined here
    // (an exception inside `startTracing` that we swallowed and logged), return the bare
    // span so the caller can still call `.end()` on it without exploding.
    if (trace === undefined) {
      this.loghandler.error("Trace is undefined after startTracing; returning unattached span.", {span});
      return span;
    }

    span.trace = trace;

    // Resolve the parent span. The default parent is the trace's rootSpan, but we may not
    // have one if the trace was started via a path that didn't set it (programming error
    // upstream, but we tolerate it). When no rootSpan exists, attach the new span as a
    // top-level orphan and warn-log once instead of crashing.
    let parentSpan: Span | undefined = trace.rootSpan;

    if (parentKeyname) {
      const parentSpans = trace.spansByKeyname[parentKeyname];
      if (parentSpans) {
        if (parentSpans.length > 1) {
          if (parentId) {
            parentSpan = parentSpans.find(span => span.id === parentId) ?? parentSpan;
          }
          // If multiple parents exist with the same keyname and no id was provided, fall back
          // to the existing default (rootSpan or whatever parentSpan was) — silent rather
          // than noisy because this is recoverable.
        } else if (parentSpans.length === 1) {
          parentSpan = parentSpans[0];
        }
      }
    }

    if (parentSpan === undefined) {
      this.loghandler.warning("startSpan: no parent span available (rootSpan is undefined). Attaching as orphan.", {
        keyname,
        parentKeyname,
        traceId: trace.id,
      });
    } else {
      parentSpan.addChild(span);
    }

    this.addSpan(span);

    return span;
  }

  /**
   * This methods adds an already created Span to the trace. It assumes that it its hierarchy is correct.
   * @param span The span to add.
   */
  public addSpan(span: Span): Span {
    // Tracing must never throw. If there's no active trace, log and return the span
    // unchanged — caller can still call `.end()` on it because Span.end uses optional
    // chaining on tracingManager.
    const trace = this.getActiveTrace();
    if (trace === undefined) {
      this.loghandler.error("You cannot call 'addSpan' without having an existing Trace.", {span});
      return span;
    }

    span.tracingManager = this;
    span.trace = trace;

    // Add it to the trace's by-keyname index so any TracingManager instance sharing this
    // trace (via EventContext) can find it.
    if (!trace.spansByKeyname[span.keyname]) {
      trace.spansByKeyname[span.keyname] = [span];
    } else {
      trace.spansByKeyname[span.keyname].push(span);
    }

    // If the tracing is deactivated, simply return the span and don't complain.
    if (this.isActive === false) {
      return span;
    }

    if (this.debug) {
      this.loghandler.debug(`[span:start] - ${span.keyname}`, {
        keyname: span.keyname,
        trace,
        span,
      })
    }

    // Notify the Tracers that a new span was started.
    this.tracers.forEach((tracer: TracerInterface) => {
      tracer.spanStartedStream?.push(span);
    })

    // If this span already has child spans, add them.
    span.children.forEach(childSpan => this.addSpan(childSpan))

    return span;
  }

  /**
   * This method ends the span using a keyname.
   * @param keyname The keyname of the span to end.
   */
  public endSpanKeyname(keyname: string) {
    const trace = this.getActiveTrace();
    if (trace === undefined) {
      return;
    }
    const spans = trace.spansByKeyname[keyname];
    if (!spans) {
      return;
    }
    if (spans.length === 1) {
      return this.endSpan(spans[0]);
    }
    this.loghandler.error("Error ending span by keyname since multiple spans exist with this keyname");
  }

  /**
   * This methods ends the span by setting the end date and by calling the tracers.
   * It will also end the trace if the rootspan is being ended.
   * @param span The span to end.
   */
  public endSpan(span: Span) {
    if (span.inProgress === false) {
      return;
    }

    span.inProgress = false;

    // When a span is ended, all of its children are automatically ended as well.
    span.children.forEach(childSpan => this.endSpan(childSpan));

    if (span.endDate === undefined) {
      span.endDate = Date.now();
    }

    if (this.isActive === false) {
      return;
    }

    if (this.debug) {
      this.loghandler.debug(`[span:end] - ${span.keyname}`, {
        trace: this.getActiveTrace(),
        span,
      })
    }

    // Notify the TraceListeners that the span was ended.
    this.tracers.forEach((tracer: TracerInterface) => {
      tracer.spanEndedStream?.push(span);
    })

    // If the span is the root span, the trace has ended
    const trace = this.getActiveTrace();
    if (span.keyname === trace?.rootSpan?.keyname) {
      this.endTrace()
    }
  }

  /**
   * This method ends the trace entirely.
   */
  public endTrace() {
    const trace = this.getActiveTrace();
    if (trace === undefined || trace.hasEnded) {
      return;
    }

    // End the trace by setting the end date.
    trace.endDate = Date.now();

    // End the trace.
    trace.hasEnded = true;

    // This method will recursively end all the spans
    if (trace.rootSpan !== undefined) {
      this.endSpan(trace.rootSpan);
    }

    if (this.isActive === false) {
      return;
    }

    // Notify every registered tracer that the trace ended. The tracers handle their own
    // formatting + transport (console pretty-print, file dump, X-Ray export, etc.). The
    // manager itself no longer logs a summary here — `ConsoleTracer` produces a richer
    // tree-formatted output when the user opts into it.
    this.tracers.forEach((tracer: TracerInterface) => {
      tracer.traceEndedStream?.push(trace);
    })
  }

  /**
   * Attaches a named, timestamped marker to the most-recently-started in-progress span.
   * Use for noteworthy moments that don't warrant a child span — "validation passed",
   * "found 50 rows", "rate limit ok". Cheap (just pushes onto an array); shows up in
   * the trace rendered by tracers (ConsoleTracer, FileTracer, X-Ray, etc.).
   *
   * If no span is currently active (no trace started, or every span has already ended),
   * a warning is logged and the marker is dropped. The warning is the explicit signal
   * that "this marker call had nowhere to go" — usually the sign of a missing
   * `startTracing()` call earlier in the flow.
   */
  public addMarkerToCurrentSpan(message: string, attributes?: { [key: string]: string }): void {
    const target = this.findActiveLeafSpan();
    if (target === undefined) {
      this.loghandler.warning(
        "TracingManager.addMarkerToCurrentSpan called outside any active trace; marker dropped.",
        {extra: {message, attributes}},
      );
      return;
    }
    target.markers.push(new SpanMarker(message, attributes));
  }

  /**
   * Returns the active trace's spans + their markers as a flat, timestamp-sorted list of
   * `{kind, name, date, attributes}` entries. Public utility for custom tracers, debug
   * endpoints, test helpers, or anyone who wants "the active trace as a flat list."
   * Returns an empty array when no active trace exists.
   */
  public getCurrentTrail(): Array<{
    kind: "span" | "marker";
    name: string;
    date: Date;
    attributes: { [key: string]: string };
  }> {
    const trace = this.getActiveTrace();
    if (trace?.rootSpan === undefined) return [];

    const out: Array<{ kind: "span" | "marker"; name: string; date: Date; attributes: { [key: string]: string } }> = [];

    const walk = (span: Span): void => {
      const suffix = span.inProgress ? " (active)" : "";
      out.push({
        kind: "span",
        name: `${span.keyname}${suffix}`,
        date: new Date(span.startDate),
        attributes: {
          spanId: span.id,
          ...(span.context ?? {}),
        },
      });

      for (const marker of span.markers) {
        out.push({
          kind: "marker",
          name: marker.message,
          date: new Date(marker.timestamp),
          attributes: {
            spanKeyname: span.keyname,
            ...(marker.attributes ?? {}),
          },
        });
      }

      for (const child of span.children) {
        walk(child);
      }
    };
    walk(trace.rootSpan);

    out.sort((a, b) => a.date.getTime() - b.date.getTime());
    return out;
  }

  /**
   * Finds the deepest in-progress span — the leaf of the still-open subtree. Used as
   * the target for `addMarkerToCurrentSpan`. Intuition: markers attach to whatever is
   * currently open at the bottom of the call stack.
   *
   * Walking the in-progress subtree (rather than ranking all spans by start date)
   * avoids the edge case where a parent and child have the same `Date.now()` value —
   * picking the "latest started" by raw timestamp would incorrectly attach to the
   * parent. Depth-first traversal of in-progress children naturally lands on the
   * deepest leaf. Tie-broken by latest start date when multiple leaves exist.
   *
   * Returns undefined when nothing is in progress (no trace, or every span has ended).
   * @private
   */
  private findActiveLeafSpan(): Span | undefined {
    const trace = this.getActiveTrace();
    if (trace?.rootSpan === undefined) return undefined;
    let best: Span | undefined;
    const walk = (span: Span): void => {
      const inProgressChildren = span.children.filter(c => c.inProgress);
      if (span.inProgress && inProgressChildren.length === 0) {
        // This span is a leaf of the in-progress subtree. Among multiple such leaves,
        // prefer the latest-started one (most recent in time).
        if (best === undefined || span.startDate >= best.startDate) {
          best = span;
        }
      }
      for (const child of inProgressChildren) walk(child);
    };
    walk(trace.rootSpan);
    return best;
  }
}
