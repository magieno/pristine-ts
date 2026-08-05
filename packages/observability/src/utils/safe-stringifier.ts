/**
 * Serializes arbitrary values to JSON with hard structural bounds. Every value the
 * observability store writes goes through this: `log.extra` routinely holds `Span` /
 * `Trace` objects whose `parentSpan` ↔ `children` back-references would blow up a naive
 * serializer, and whose fully-expanded tree can reach megabytes for a single entry.
 *
 * Four independent guards, all applied during the walk:
 *
 * - **Cycles** — an object already seen on the current path renders as `"[Circular]"`.
 * - **Depth** — anything nested past `maxDepth` renders as `"[MaxDepth]"`.
 * - **Width** — arrays past `maxArrayLength` and objects past `maxKeys` are cut, with a
 *   trailing `"[…N more]"` marker so the truncation is visible in the output.
 * - **String length** — strings past `maxStringLength` are cut with a `…(N more chars)`
 *   suffix.
 *
 * The result is always valid JSON — truncation replaces values with marker *strings*
 * rather than producing a clipped document, so `pristine logs` can still parse every
 * line it reads back.
 *
 * Pure past construction: instantiate once with the configured bounds and reuse.
 */
export class SafeStringifier {
  static readonly CIRCULAR_MARKER = "[Circular]";
  static readonly MAX_DEPTH_MARKER = "[MaxDepth]";

  constructor(
    private readonly maxDepth: number = 12,
    private readonly maxArrayLength: number = 200,
    private readonly maxKeys: number = 200,
    private readonly maxStringLength: number = 8192,
  ) {
  }

  /**
   * The bounded JSON representation of `value`. Never throws — a value that cannot be
   * serialized at all (a `BigInt`, an exotic `toJSON` that throws) degrades to a marker
   * string rather than propagating.
   */
  stringify(value: unknown): string {
    try {
      return JSON.stringify(this.sanitize(value, 0, new Set<object>())) ?? "null";
    } catch {
      return JSON.stringify({__unserializable: true});
    }
  }

  /**
   * Recursively rebuilds `value` as a structure that is guaranteed to serialize within
   * the configured bounds. `seen` holds the objects on the *current path* only — a value
   * legitimately referenced twice in sibling positions (a shared config object, say) is
   * expanded both times; only an actual cycle becomes a marker.
   */
  private sanitize(value: unknown, depth: number, seen: Set<object>): unknown {
    if (typeof value === "string") {
      return this.truncateString(value);
    }

    if (typeof value === "bigint") {
      return `${value.toString()}n`;
    }

    if (typeof value === "function" || typeof value === "symbol") {
      return `[${typeof value}]`;
    }

    if (value === null || typeof value !== "object") {
      // `undefined` is passed through so JSON.stringify drops the key, as it would natively.
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: this.truncateString(value.message),
        stack: value.stack === undefined ? undefined : this.truncateString(value.stack),
      };
    }

    if (seen.has(value)) {
      return SafeStringifier.CIRCULAR_MARKER;
    }

    if (depth >= this.maxDepth) {
      return SafeStringifier.MAX_DEPTH_MARKER;
    }

    seen.add(value);
    try {
      return Array.isArray(value)
        ? this.sanitizeArray(value, depth, seen)
        : this.sanitizeObject(value as Record<string, unknown>, depth, seen);
    } finally {
      // Leaving this node: it is no longer on the current path, so a sibling that
      // references the same object is not a cycle.
      seen.delete(value);
    }
  }

  private sanitizeArray(value: unknown[], depth: number, seen: Set<object>): unknown[] {
    const kept = value.slice(0, this.maxArrayLength).map(entry => this.sanitize(entry, depth + 1, seen));
    if (value.length > this.maxArrayLength) {
      kept.push(`[…${value.length - this.maxArrayLength} more]`);
    }
    return kept;
  }

  private sanitizeObject(value: Record<string, unknown>, depth: number, seen: Set<object>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const keys = Object.keys(value);
    for (const key of keys.slice(0, this.maxKeys)) {
      try {
        result[key] = this.sanitize(value[key], depth + 1, seen);
      } catch {
        // A throwing getter must not take down the whole entry.
        result[key] = "[Unreadable]";
      }
    }
    if (keys.length > this.maxKeys) {
      result["__truncatedKeys"] = keys.length - this.maxKeys;
    }
    return result;
  }

  private truncateString(value: string): string {
    if (value.length <= this.maxStringLength) {
      return value;
    }
    return `${value.slice(0, this.maxStringLength)}…(${value.length - this.maxStringLength} more chars)`;
  }
}
