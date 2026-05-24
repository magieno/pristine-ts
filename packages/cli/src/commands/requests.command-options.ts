import "reflect-metadata";
import {IsNumber, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine requests [--limit <n>] [--run <runId>]`.
 */
export class RequestsCommandOptions {
  /** `--run <id>`: pick a specific run instead of the latest. */
  @IsOptional()
  @IsString()
  run?: string;

  /** `--limit <n>`: cap the number of summaries returned. Default `20`. */
  @IsOptional()
  @IsNumber()
  limit?: number;
}
