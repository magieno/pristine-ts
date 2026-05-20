import {injectable} from "tsyringe";
import {moduleScoped, UsageError, ValidationError} from "@pristine-ts/common";
import {Validator} from "@pristine-ts/class-validator";
import {plainToInstance} from "class-transformer";
import {CommandInterface} from "../interfaces/command.interface";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliErrorCode} from "../errors/cli-error-code.enum";

/**
 * Maps a command's raw parsed arguments onto a typed, validated instance of its
 * `optionsType`. Extracted from `CliEventHandler` so both the one-shot dispatch path and
 * the interactive REPL resolve and validate arguments through exactly the same logic.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandArgumentResolver {
  constructor(private readonly validator: Validator) {
  }

  /**
   * For commands that opt out of typed options (`optionsType === null`), passes the raw
   * args through unchanged. Otherwise maps them onto a real instance of `optionsType`
   * (so `class-validator` decorator metadata is present) and validates it.
   *
   * Throws `UsageError` for mapping failures and `ValidationError` for validation
   * failures — both carry structured `details` for `CliErrorReporter`.
   */
  async resolve(command: CommandInterface<any>, rawArgs: any): Promise<any> {
    if (command.optionsType === null) {
      return rawArgs;
    }

    let mapped: any;
    try {
      // class-transformer's plainToInstance produces a real instance of the options class
      // (prototype + decorator metadata intact) so class-validator can find its rules.
      mapped = plainToInstance(command.optionsType, rawArgs);
    } catch (cause) {
      throw new UsageError(
        `Failed to map CLI arguments to '${command.optionsType.name}': ${(cause as Error).message}`,
        {
          code: CliErrorCode.ArgumentMappingFailed,
          cause: cause as Error,
          details: {targetType: command.optionsType.name},
        },
      );
    }

    const validationErrors = await this.validator.validate(mapped);
    if (validationErrors.length === 0) {
      return mapped;
    }

    // Reshape the class-validator output into structured `details` the reporter can
    // render line-by-line. Keeps the throw single-pass and the reporter format-agnostic.
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
