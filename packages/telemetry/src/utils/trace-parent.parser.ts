import {TraceParent} from "../models/trace-parent.model";

/**
 * Reads W3C Trace Context `traceparent` values (https://www.w3.org/TR/trace-context/).
 *
 * The format is `version-traceId-parentId-flags`, all lowercase hex:
 * `00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`.
 *
 * The 32 hex characters of the trace id are returned as a UUID, the form Pristine
 * uses for `Trace.id`, so a trace continued from a caller looks like one started here.
 * Transport-agnostic: HTTP reads it from a header, a queue could read it from a message
 * attribute.
 */
export class TraceParentParser {
  private static readonly InvalidVersion = "ff";
  private static readonly ZeroTraceId = "0".repeat(32);
  private static readonly ZeroParentId = "0".repeat(16);
  private static readonly SampledFlag = 0x01;

  /**
   * Returns the parsed value, or `undefined` when the value is missing or invalid. The
   * spec says an invalid `traceparent` must be ignored, so this never throws.
   * @param value The raw `traceparent` value.
   */
  public static parse(value: string | undefined): TraceParent | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const parts = value.trim().split("-");
    if (parts.length < 4) {
      return undefined;
    }

    const [version, traceId, parentId, flags] = parts;

    if (/^[0-9a-f]{2}$/.test(version) === false || version === TraceParentParser.InvalidVersion) {
      return undefined;
    }

    // Version 00 has exactly four fields. Later versions may append fields, which a
    // version 00 reader must ignore.
    if (version === "00" && parts.length !== 4) {
      return undefined;
    }

    if (/^[0-9a-f]{32}$/.test(traceId) === false || traceId === TraceParentParser.ZeroTraceId) {
      return undefined;
    }

    if (/^[0-9a-f]{16}$/.test(parentId) === false || parentId === TraceParentParser.ZeroParentId) {
      return undefined;
    }

    if (/^[0-9a-f]{2}$/.test(flags) === false) {
      return undefined;
    }

    return new TraceParent(
      TraceParentParser.toUuid(traceId),
      parentId,
      (parseInt(flags, 16) & TraceParentParser.SampledFlag) === TraceParentParser.SampledFlag,
    );
  }

  /**
   * `4bf92f3577b34da6a3ce929d0e0e4736` → `4bf92f35-77b3-4da6-a3ce-929d0e0e4736`.
   */
  private static toUuid(hex: string): string {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
