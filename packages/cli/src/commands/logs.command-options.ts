import "reflect-metadata";
import {IsArray, IsBoolean, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags + positional for `pristine logs [<id>] [--event-id <x>] [--trace-id <x>] [--request-id <x>] [--follow|-f]`.
 *
 * Filter the log stream by any of three correlation ids — `--event-id` is canonical,
 * `--trace-id` covers the distributed-tracing case (a propagated `traceparent`),
 * `--request-id` covers HTTP requests with an `x-pristine-request-id` header. A
 * positional id (e.g. `pristine logs abc-123`) is tried against all three.
 *
 * `--follow` and `-f` are accepted as independent boolean keys (that's how
 * `CommandEventMapper` records short-vs-long flags); the `isFollowing` getter combines
 * them so the command body reads a single field.
 */
export class LogsCommandOptions {
  /** `--event-id <id>`: filter by the canonical event id. */
  @IsOptional()
  @IsString()
  "event-id"?: string;

  /** `--trace-id <id>`: filter by the trace id (distributed-tracing scenarios). */
  @IsOptional()
  @IsString()
  "trace-id"?: string;

  /** `--request-id <id>`: filter by the request id (HTTP `x-pristine-request-id`). */
  @IsOptional()
  @IsString()
  "request-id"?: string;

  /** `--follow`: tail the log stream and render new entries as they arrive. */
  @IsOptional()
  @IsBoolean()
  follow?: boolean;

  /** `-f`: short alias for `--follow`. */
  @IsOptional()
  @IsBoolean()
  f?: boolean;

  /**
   * Bare positional tokens. A positional id is tried against all three correlation
   * fields by `LogStore.read(id)` / `LogStore.tail(id, ...)`. Decorators are required
   * for `AutoDataMappingBuilder` to round-trip the field.
   */
  @IsOptional()
  @IsArray()
  _?: string[];

  /**
   * Resolves the filter id: an explicit flag wins over the positional, and explicit
   * flags are preferred in `eventId > traceId > requestId` order on the (rare) chance
   * the user passed several.
   */
  get filterId(): string | undefined {
    return this["event-id"] ?? this["trace-id"] ?? this["request-id"] ?? this._?.[0];
  }

  get isFollowing(): boolean {
    return this.follow === true || this.f === true;
  }
}
