import "reflect-metadata";
import {IsArray, IsIn, IsOptional, IsString} from "@pristine-ts/class-validator";

export type TraceFormat = "tree" | "flat" | "json";

/**
 * Flags + positional for `pristine trace [<id>] [--event-id <x>] [--trace-id <x>] [--request-id <x>] [--format tree|flat|json]`.
 *
 * Look up a trace by any of three correlation ids — `--event-id` is canonical,
 * `--trace-id` covers the distributed-tracing case (a propagated `traceparent`),
 * `--request-id` covers HTTP requests with an `x-pristine-request-id` header. A
 * positional id is tried against all three.
 */
export class TraceCommandOptions {
  /** `--event-id <id>`: look up by the canonical event id. */
  @IsOptional()
  @IsString()
  "event-id"?: string;

  /** `--trace-id <id>`: look up by the trace id (distributed-tracing scenarios). */
  @IsOptional()
  @IsString()
  "trace-id"?: string;

  /** `--request-id <id>`: look up by the request id (HTTP `x-pristine-request-id`). */
  @IsOptional()
  @IsString()
  "request-id"?: string;

  /** `--format tree|flat|json`: how to render the trace. Defaults to `tree`. */
  @IsOptional()
  @IsIn(["tree", "flat", "json"])
  format?: TraceFormat;

  /**
   * Bare positional tokens. A positional id is tried against all three correlation
   * fields by `TraceStore.find(id)`. Decorators are required for `AutoDataMappingBuilder`
   * to round-trip the field.
   */
  @IsOptional()
  @IsArray()
  _?: string[];

  /**
   * Resolves the lookup id: an explicit flag wins over the positional, and explicit
   * flags are preferred in `eventId > traceId > requestId` order.
   */
  get lookupId(): string | undefined {
    return this["event-id"] ?? this["trace-id"] ?? this["request-id"] ?? this._?.[0];
  }
}
