import "reflect-metadata";
import {IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine mysql:status [--config <keyname>]`. Status is informational
 * and always exits 0 — for a CI gate that fails on drift, use `mysql:verify`.
 */
export class MysqlMigrateStatusCommandOptions {
  @IsOptional()
  @IsString()
  config?: string;
}
