import "reflect-metadata";
import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {moduleScoped} from "@pristine-ts/common";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";
import {CommandParameterOptions} from "../options/command-parameter.options";

/**
 * Builds the one-line `Usage:` synopsis for a command from its options class, e.g.
 *
 *   Usage: myapp key:add --name=<name> [--pubkey=<key-or-file>] [--rotate]
 *
 * Every declared option property becomes a token: required values render as `--flag=<hint>`,
 * optional values as `[--flag=<hint>]`, and booleans as `[--flag]` (presence flags take no
 * value). The placeholder defaults to the property name and can be overridden per parameter
 * with `@commandParameter({valueHint})`; the flag honors `@commandParameter({flag})`.
 *
 * "Required" means the absence of an `@IsOptional()` condition on the property — the same
 * signal the validator uses to decide whether a missing value is an error.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandUsageRenderer {
  /** `@pristine-ts/class-validator` stores each `@IsOptional()` as a condition here. */
  private static readonly ConditionMetadataKey = "pristine-validator:condition";

  /**
   * Renders `Usage: <bin> <command> <tokens…>`. `binName` is the resolved program name (see
   * `ProgramNameResolver`); `commandName` is the command's `name`.
   */
  render(optionsType: ClassConstructor<any>, commandName: string, binName: string): string {
    const tokens = this.collectTokens(optionsType);
    const synopsis = [binName, commandName, ...tokens].filter((part) => part.length > 0).join(" ");
    return `Usage: ${synopsis}`;
  }

  /**
   * One synopsis token per declared option property, in declaration order.
   * @private
   */
  private collectTokens(optionsType: ClassConstructor<any>): string[] {
    const properties = ClassMetadata.getInformation(optionsType).properties;
    const tokens: string[] = [];

    for (const propertyKey of properties) {
      const options: CommandParameterOptions | undefined = PropertyMetadata.getMetadata(optionsType.prototype, propertyKey, CliDecoratorMetadataKeynameEnum.CommandParameter);
      const flag = options?.flag ?? propertyKey;

      // Booleans are presence flags — they never take a value.
      if (Reflect.getMetadata("design:type", optionsType.prototype, propertyKey) === Boolean) {
        tokens.push(`[--${flag}]`);
        continue;
      }

      const body = `--${flag}=<${options?.valueHint ?? propertyKey}>`;
      tokens.push(this.isRequired(optionsType, propertyKey) ? body : `[${body}]`);
    }

    return tokens;
  }

  /**
   * A property is required unless it carries an `@IsOptional()` condition. Read defensively: an
   * unexpected metadata shape is treated as required (the safer default for a usage hint).
   * @private
   */
  private isRequired(optionsType: ClassConstructor<any>, propertyKey: string): boolean {
    const conditions = PropertyMetadata.getMetadata(optionsType.prototype, propertyKey, CommandUsageRenderer.ConditionMetadataKey);
    if (Array.isArray(conditions) === false) {
      return true;
    }
    return conditions.some((condition) => condition?.constructor?.name === "IsOptionalCondition") === false;
  }
}
