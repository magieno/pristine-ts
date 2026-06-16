import "reflect-metadata";
import {IsNotEmpty, IsOptional, IsString} from "@pristine-ts/class-validator";
import {commandParameter} from "@pristine-ts/cli";

/**
 * Flags for `pristine mysql:create --name <name> [--config <keyname>]`.
 *
 * `name` is the human-readable description (e.g. `add-products-table`). The scaffold
 * slugifies it, prepends the next sequential number, and writes the `.ts` file. It is
 * required; when it isn't passed and the terminal is interactive, the CLI asks for it.
 */
export class MysqlMigrateCreateCommandOptions {
  @commandParameter({question: "Migration name (e.g. add-products-table)?"})
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  config?: string;
}
