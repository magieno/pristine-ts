import {PropertyMetadata} from "@pristine-ts/metadata";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";
import {CommandParameterOptions} from "../options/command-parameter.options";

/**
 * Describes a command-line parameter on a command's options class. Stored as property
 * metadata and read by the CLI while resolving a command's arguments — before the arguments
 * are mapped onto the options instance and validated.
 *
 * Two behaviors flow from the options:
 *
 *   - `flag` rebinds the property to a differently-named flag (the property name is the
 *     default), so the property and the flag no longer have to be spelled identically.
 *   - `question` makes the CLI ask for the value interactively when the flag is absent
 *     (subject to configuration and an interactive terminal). Omit it to never prompt.
 *
 * ```ts
 * import {IsString, IsOptional} from "@pristine-ts/class-validator";
 * import {commandParameter} from "@pristine-ts/cli";
 *
 * export class MigrateCommandOptions {
 *   @commandParameter({flag: "db-url", question: "What is the database URL?"})
 *   @IsString()
 *   databaseUrl?: string;            // bound to --db-url; asked for when missing
 *
 *   @commandParameter({flag: "dir"}) // bound to --dir; never asked for
 *   @IsOptional()
 *   @IsString()
 *   migrationsDirectory?: string;
 * }
 * ```
 */
export const commandParameter = (options: CommandParameterOptions = {}) => {
  return (target: any, propertyKey: string) => {
    PropertyMetadata.defineMetadata(target, propertyKey, CliDecoratorMetadataKeynameEnum.CommandParameter, options);
  };
};
