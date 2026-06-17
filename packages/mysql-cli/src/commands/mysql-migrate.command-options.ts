import "reflect-metadata";
import {IsBoolean, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine mysql:migrate [--config <keyname>] [--dry-run] [--force]`.
 *
 * `--config` picks the `MysqlConfig.uniqueKeyname` to target. Defaults to
 * `__default__`. `--dry-run` prints the plan without writing anything. `--force`
 * overrides the refusal-to-proceed when drift (Modified / Orphaned entries) is
 * detected — used sparingly, on environments you're comfortable diverging.
 */
export class MysqlMigrateCommandOptions {
  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @IsBoolean()
  "dry-run"?: boolean;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
