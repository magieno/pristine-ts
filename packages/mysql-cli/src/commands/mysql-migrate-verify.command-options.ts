import "reflect-metadata";
import {IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine mysql:verify [--config <keyname>]`. Verify exits non-zero
 * when any Modified or Orphaned entries are detected; designed for CI gates.
 */
export class MysqlMigrateVerifyCommandOptions {
  @IsOptional()
  @IsString()
  config?: string;
}
