import "reflect-metadata";
import {IsArray, IsBoolean, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags + positional for `pristine logs [<traceId>] [--follow|-f] [--run <runId>]`.
 *
 * `--follow` and `-f` are accepted as independent boolean keys (that's how
 * `CommandEventMapper` records short-vs-long flags); the `isFollowing` getter combines
 * them so the command body reads a single field.
 *
 * The positional `<traceId>` lands in the reserved `_` array. The `traceId` getter
 * reads the first element.
 */
export class LogsCommandOptions {
  /** `--run <id>`: pick a specific run instead of the latest. */
  @IsOptional()
  @IsString()
  run?: string;

  /** `--follow`: tail the log file and render new lines as they arrive. */
  @IsOptional()
  @IsBoolean()
  follow?: boolean;

  /** `-f`: short alias for `--follow`. */
  @IsOptional()
  @IsBoolean()
  f?: boolean;

  /**
   * Bare positional tokens, collected in order. The trace-id filter is the first
   * element — exposed through the `traceId` getter rather than indexing `_` directly.
   * Decorators are required for `AutoDataMappingBuilder` to round-trip the field.
   */
  @IsOptional()
  @IsArray()
  _?: string[];

  get traceId(): string | undefined {
    return this._?.[0];
  }

  get isFollowing(): boolean {
    return this.follow === true || this.f === true;
  }
}
