import "reflect-metadata";
import {IsArray, IsIn, IsOptional, IsString} from "@pristine-ts/class-validator";

export type TraceFormat = "tree" | "flat" | "json";

/**
 * Flags + positional for `pristine trace <traceId> [--format tree|flat|json] [--run <runId>]`.
 *
 * The positional `<traceId>` lands in the reserved `_` array that `CommandEventMapper`
 * collects bare tokens into. The `traceId` getter reads the first element so the command
 * body uses a meaningful name without indexing the underscore directly.
 */
export class TraceCommandOptions {
  /** `--run <id>`: pick a specific run instead of searching from the latest. */
  @IsOptional()
  @IsString()
  run?: string;

  /** `--format tree|flat|json`: how to render the trace. Defaults to `tree`. */
  @IsOptional()
  @IsIn(["tree", "flat", "json"])
  format?: TraceFormat;

  /**
   * Bare positional tokens, collected in order by `CommandEventMapper`. The decorators
   * are required for `AutoDataMappingBuilder` to round-trip the field — it skips
   * properties that aren't in the class metadata.
   */
  @IsOptional()
  @IsArray()
  _?: string[];

  get traceId(): string | undefined {
    return this._?.[0];
  }
}
