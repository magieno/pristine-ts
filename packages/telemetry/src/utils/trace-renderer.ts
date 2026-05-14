import {Trace} from "../models/trace.model";
import {Span} from "../models/span.model";

/**
 * Pure-function renderers for `Trace` objects. Used by both `ConsoleTracer` (writes to
 * stdout) and `FileTracer` (writes to disk) so the visual output is identical regardless
 * of destination.
 */

/**
 * Indented ASCII tree mirroring the span hierarchy. Right-aligned durations, slowest leaf
 * span flagged as `← bottleneck`. Best for human readers.
 *
 * Internal/parent spans are skipped for bottleneck detection on purpose: a parent's
 * duration is the sum of its children's work, so it would always dwarf any single leaf
 * and the flag would never highlight where the actual time was spent.
 */
export function renderTraceAsTree(trace: Trace): string {
  const lines: string[] = [];
  lines.push(`Trace ${trace.id} — ${trace.getDuration()}ms`);

  if (trace.rootSpan === undefined) {
    lines.push("  (no rootSpan)");
    return lines.join("\n");
  }

  // Pre-walk to find the slowest leaf for the bottleneck flag.
  let slowestSpan: Span | undefined;
  let slowestDuration = -1;
  walkSpans(trace.rootSpan, (s) => {
    if (s.children.length > 0) return;
    const d = s.getDuration();
    if (d > slowestDuration) {
      slowestDuration = d;
      slowestSpan = s;
    }
  });

  type Row = {prefix: string; name: string; duration: number; isBottleneck: boolean};
  const rows: Row[] = [];

  const renderNode = (span: Span, ancestorIsLast: boolean[]): void => {
    const prefix = ancestorIsLast.length === 0
      ? ""
      : ancestorIsLast.slice(0, -1).map(isLast => isLast ? "    " : "│   ").join("")
        + (ancestorIsLast[ancestorIsLast.length - 1] ? "└── " : "├── ");

    rows.push({
      prefix,
      name: span.keyname,
      duration: span.getDuration(),
      isBottleneck: span === slowestSpan && slowestDuration > 0,
    });

    span.children.forEach((child, idx) => {
      const isLast = idx === span.children.length - 1;
      renderNode(child, [...ancestorIsLast, isLast]);
    });
  };
  renderNode(trace.rootSpan, []);

  // Pad name column so durations line up.
  const nameColumnWidth = Math.max(...rows.map(r => r.prefix.length + r.name.length));
  for (const row of rows) {
    const padding = " ".repeat(Math.max(1, nameColumnWidth - row.prefix.length - row.name.length + 2));
    const durationCell = `${row.duration}ms`.padStart(8);
    const marker = row.isBottleneck ? "  ← bottleneck" : "";
    lines.push(`${row.prefix}${row.name}${padding}${durationCell}${marker}`);
  }

  return lines.join("\n");
}

/**
 * One line per span sorted by start time, no indentation. Best for grep / log aggregation.
 */
export function renderTraceAsFlat(trace: Trace): string {
  const lines: string[] = [`Trace ${trace.id} — ${trace.getDuration()}ms`];
  const all: Span[] = [];
  if (trace.rootSpan !== undefined) {
    walkSpans(trace.rootSpan, (s) => all.push(s));
  }
  all.sort((a, b) => a.startDate - b.startDate);
  for (const span of all) {
    lines.push(`  ${span.keyname.padEnd(48)} ${`${span.getDuration()}ms`.padStart(8)}`);
  }
  return lines.join("\n");
}

/**
 * Pretty-printed JSON dump of the trace + every span. Best for piping into a downstream
 * tool that wants structured access.
 */
export function renderTraceAsJson(trace: Trace): string {
  return JSON.stringify(serializeTrace(trace), null, 2);
}

/** Serializes a trace to a plain JSON-friendly object. Exposed for callers that want
 * to embed the structured form in a larger payload (e.g. a NDJSON line). */
export function serializeTrace(trace: Trace): Record<string, unknown> {
  return {
    id: trace.id,
    startDate: trace.startDate,
    endDate: trace.endDate,
    duration: trace.getDuration(),
    context: trace.context,
    rootSpan: trace.rootSpan ? serializeSpan(trace.rootSpan) : undefined,
  };
}

function serializeSpan(span: Span): Record<string, unknown> {
  return {
    id: span.id,
    keyname: span.keyname,
    startDate: span.startDate,
    endDate: span.endDate,
    duration: span.getDuration(),
    context: span.context,
    children: span.children.map(serializeSpan),
  };
}

/** Depth-first traversal helper. Visits the root and every descendant once. */
function walkSpans(span: Span, visit: (s: Span) => void): void {
  visit(span);
  for (const child of span.children) {
    walkSpans(child, visit);
  }
}
