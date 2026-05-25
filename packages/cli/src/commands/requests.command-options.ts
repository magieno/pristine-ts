import "reflect-metadata";
import {IsNumber, IsOptional} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine requests [--limit <n>]`.
 */
export class RequestsCommandOptions {
  /** `--limit <n>`: cap the number of summaries returned. Default `20`. */
  @IsOptional()
  @IsNumber()
  limit?: number;
}
