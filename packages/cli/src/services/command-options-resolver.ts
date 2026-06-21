import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {moduleScoped, UsageError} from "@pristine-ts/common";
import {Validator} from "@pristine-ts/class-validator";
import {AutoDataMappingBuilderOptions, DataMapper} from "@pristine-ts/data-mapping";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {CommandParameterPrompter} from "./command-parameter-prompter";
import {CommandArgumentErrorFormatter} from "./command-argument-error-formatter";
import {ProgramNameResolver} from "./program-name-resolver";

/**
 * Resolves a typed, validated options instance from raw arguments: it fills any missing
 * `@commandParameter` values by prompting, maps the result onto a real `optionsType` instance
 * (prototype + decorator metadata intact, so `class-validator` finds its rules), and validates
 * it.
 *
 * This is the reusable core behind command dispatch — `CommandArgumentResolver` delegates here
 * — exposed so commands and dynamic flows can fill an options class from prompts on demand,
 * including ones not tied to a registered command:
 *
 * ```ts
 * constructor(private readonly optionsResolver: CommandOptionsResolver) {}
 * // ...later, possibly choosing the class at runtime:
 * const options = await this.optionsResolver.resolve(MyOptions, {region: "us"});
 * ```
 *
 * Argument problems throw a `UsageError` (exit 64): mapping failures directly, and validation
 * failures via `CommandArgumentErrorFormatter`, which renders a clean `Usage:` synopsis (for a
 * missing required value) or `Invalid <flag> '<value>'. …` lines (for a supplied-but-invalid
 * value) rather than a raw constraint dump.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandOptionsResolver {
  constructor(
    private readonly validator: Validator,
    private readonly dataMapper: DataMapper,
    private readonly commandParameterPrompter: CommandParameterPrompter,
    private readonly argumentErrorFormatter: CommandArgumentErrorFormatter,
    private readonly programNameResolver: ProgramNameResolver,
  ) {
  }

  /**
   * Prompts for any missing parameters declared on `optionsType`, then maps `rawArgs` (plus the
   * prompted answers) onto a real instance and validates it. `rawArgs` seeds the values already
   * known — anything absent that carries a `question` is asked for interactively.
   * `context.commandName` is woven into the `Usage:` line shown when a required value is missing
   * (defaults to a neutral placeholder for direct, command-less callers).
   */
  async resolve<T>(optionsType: ClassConstructor<T>, rawArgs: Record<string, any> = {}, context: {commandName?: string} = {}): Promise<T> {
    const preparedArgs = await this.commandParameterPrompter.fillMissingParameters(optionsType, rawArgs);

    let mapped: T;
    try {
      // `throwOnErrors: true` so a normalizer failure surfaces here instead of `autoMap`
      // silently returning the source object (which would defeat validation downstream).
      mapped = await this.dataMapper.autoMap(preparedArgs, optionsType, new AutoDataMappingBuilderOptions({throwOnErrors: true}));
    } catch (cause) {
      throw new UsageError(
        `Failed to map arguments to '${optionsType.name}': ${(cause as Error).message}`,
        {
          code: CliErrorCode.ArgumentMappingFailed,
          cause: cause as Error,
          details: {targetType: optionsType.name},
        },
      );
    }

    const validationErrors = await this.validator.validate(mapped);
    if (validationErrors.length === 0) {
      return mapped;
    }

    // Hand the raw class-validator output to the formatter, which classifies missing vs invalid
    // and produces a clean, plain-rendered `UsageError` (exit 64).
    throw this.argumentErrorFormatter.buildValidationError(optionsType, mapped as Record<string, any>, validationErrors, {
      commandName: context.commandName ?? "<command>",
      binName: this.programNameResolver.resolve(),
    });
  }
}
