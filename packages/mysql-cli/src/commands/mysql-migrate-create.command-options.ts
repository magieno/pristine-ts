import "reflect-metadata";
import {IsArray, IsOptional, IsString} from "@pristine-ts/class-validator";

/**
 * Flags for `pristine mysql:create <name> [--config <keyname>]`.
 *
 * `name` is the human-readable description (`add-products-table`). The scaffold
 * slugifies it, prepends the next sequential number, and writes the `.ts` file.
 *
 * Accepts the descriptive name either as the positional argument (collected on the
 * bare `_` array by `CommandEventMapper`) or as `--name <name>`.
 */
export class MysqlMigrateCreateCommandOptions {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  config?: string;

  @IsOptional()
  @IsArray()
  _?: string[];

  public get descriptiveName(): string | undefined {
    return this.name ?? this._?.[0];
  }
}
