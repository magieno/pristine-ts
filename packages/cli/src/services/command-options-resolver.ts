import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {moduleScoped, UsageError, ValidationError} from "@pristine-ts/common";
import {Validator} from "@pristine-ts/class-validator";
import {AutoDataMappingBuilderOptions, DataMapper} from "@pristine-ts/data-mapping";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {CommandParameterPrompter} from "./command-parameter-prompter";

/**
 * Resolves a typed, validated options instance from raw arguments: it fills any missing
 * `@commandParameter` values by prompting, maps the result onto a real `optionsType`
 * instance (prototype + decorator metadata intact, so `class-validator` finds its rules),
 * and validates it.
 *
 * This is the reusable core behind command dispatch — `CommandArgumentResolver` delegates
 * here — exposed so commands and dynamic flows can fill an options class from prompts on
 * demand, including ones not tied to a registered command:
 *
 * ```ts
 * constructor(private readonly optionsResolver: CommandOptionsResolver) {}
 * // ...later, possibly choosing the class at runtime:
 * const options = await this.optionsResolver.resolve(MyOptions, {region: "us"});
 * ```
 *
 * Throws `UsageError` for mapping failures and `ValidationError` for validation failures —
 * both carry structured `details` for `CliErrorReporter`.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandOptionsResolver {
  constructor(
    private readonly validator: Validator,
    private readonly dataMapper: DataMapper,
    private readonly commandParameterPrompter: CommandParameterPrompter,
  ) {
  }

  /**
   * Prompts for any missing parameters declared on `optionsType`, then maps `rawArgs` (plus
   * the prompted answers) onto a real instance and validates it. `rawArgs` seeds the values
   * already known — anything absent that carries a `question` is asked for interactively.
   */
  async resolve<T>(optionsType: ClassConstructor<T>, rawArgs: Record<string, any> = {}): Promise<T> {
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

    // Reshape the class-validator output into structured `details` the reporter can render
    // line-by-line. Keeps the throw single-pass and the reporter format-agnostic.
    const failures: Record<string, string[]> = {};
    for (const error of validationErrors) {
      const messages: string[] = [];
      for (const constraintKey in error.constraints) {
        // `@pristine-ts/class-validator` stores constraints as `{keyname, message}` objects
        // rather than the plain strings vanilla class-validator uses. Extract the message
        // when present, falling back to JSON for unknown shapes so we never print
        // `[object Object]`.
        const constraint = error.constraints[constraintKey];
        const message = typeof constraint === "string"
          ? constraint
          : (constraint && typeof constraint === "object" && typeof (constraint as any).message === "string")
            ? (constraint as any).message
            : JSON.stringify(constraint);
        messages.push(`[${constraintKey}] ${message}`);
      }
      failures[error.property] = messages;
    }
    throw new ValidationError("Argument validation failed", {
      code: CliErrorCode.ArgumentValidationFailed,
      details: failures,
    });
  }
}
