/**
 * How `ConsoleTracer` renders a completed trace.
 */
export enum ConsoleTracerOutputModeEnum {
  /** Indented ASCII tree mirroring the span hierarchy. Best for human readers. */
  Tree = "tree",
  /** Pretty-printed JSON dump of the trace + every span. Best for piping into a tool. */
  Json = "json",
  /** One span per line, no indentation, sorted by start time. Best for grep. */
  Flat = "flat",
}
