import {UuidGenerator} from "../utils/uuid.util";
import {SpanLifecycleOwnerInterface} from "./span-lifecycle-owner.interface";
import {SpanMarker} from "./span-marker.model";
import {Trace} from "./trace.model";

/**
 * This model represents a span.
 */
export class Span {
  /**
   * The unique id of the span.
   */
  public id: string;

  /**
   * The owner of the span (typically a TracingManager). Set when the span is created so
   * `span.end()` can delegate back to the manager.
   */
  public tracingManager?: SpanLifecycleOwnerInterface;

  /**
   * The trace the span is attached to.
   */
  public trace?: Trace;

  /**
   * The timestamp in milliseconds at which the span was started.
   */
  public startDate: number = Date.now();

  /**
   * The timestamp in milliseconds at which the span was ended.
   */
  public endDate?: number;

  /**
   * The parent span.
   */
  public parentSpan?: Span;

  /**
   * The children spans.
   */
  public children: Span[] = [];

  /**
   * Named, timestamped markers attached to this span. Use these for noteworthy moments
   * inside the span's lifetime that don't warrant their own child span — e.g.
   * "validation passed", "found 50 rows in DB". Empty by default; populated by
   * `TracingManager.addMarkerToCurrentSpan(...)`.
   *
   * Markers are flat by design (instants, not durations). For hierarchical timing, use
   * child spans.
   */
  public markers: SpanMarker[] = [];

  /**
   * The context associated with the span.
   */
  public context: { [key: string]: string } = {};

  /**
   * Whether or not the span is in progress, meaning it has not ended.
   */
  public inProgress = true;

  /**
   * This model represents a span.
   * @param keyname The keyname of the span.
   * @param id The unique id of the span.
   * @param context The context to associate with the span.
   */
  public constructor(public keyname: string, id?: string, context?: { [key: string]: string }) {
    this.id = id ?? UuidGenerator.generate();
    this.context = context ?? {};
  }

  /**
   * This method returns the duration of the span in milliseconds.
   */
  public getDuration(): number {
    return (this.endDate ?? Date.now()) - this.startDate;
  }

  /**
   * This method ends the span.
   */
  public end(): void {
    this.tracingManager?.endSpan(this);
  }

  /**
   * This method sets the trace for the span and all of its children.
   * @param trace The trace the span should be attached to.
   */
  public setTrace(trace: Trace): void {
    this.trace = trace;

    this.children.forEach(childSpan => childSpan.setTrace(trace));
  }

  /**
   * This method adds a child span to the current span. It only adds it if it's not already part of the children.
   * @param span The span to add as a child.
   */
  public addChild(span: Span): void {
    const existingChildSpan = this.children.find(childSpan => childSpan.id === span.id);

    if (existingChildSpan) {
      return;
    }

    span.parentSpan = this;
    this.children.push(span);
  }
}
