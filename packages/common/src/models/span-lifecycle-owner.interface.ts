import {Span} from "./span.model";

/**
 * Minimal structural type for the back-reference a `Span` keeps to whatever lifecycle
 * owner created it. Lets `span.end()` delegate without importing the full
 * `TracingManagerInterface` (which is registered through DI under the
 * `"TracingManagerInterface"` token). Telemetry's `TracingManagerInterface` satisfies
 * this shape by having a compatible `endSpan` method.
 */
export interface SpanLifecycleOwnerInterface {
  endSpan(span: Span): void;
}
