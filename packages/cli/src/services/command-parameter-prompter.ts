import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {injectConfig, moduleScoped, UsageError} from "@pristine-ts/common";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliConfigurationKeys} from "../cli.configuration-keys";
import {CliPrompt} from "../managers/cli-prompt.manager";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";
import {CommandParameterOptions} from "../options/command-parameter.options";
import {CliErrorCode} from "../errors/cli-error-code.enum";

/**
 * Applies a command's `@commandParameter` metadata to its raw, parsed arguments before they
 * are mapped onto the options instance and validated. Two things happen here:
 *
 *   1. **Flag binding** — a parameter whose `flag` differs from its property name is copied
 *      from the flag key onto the property key, so the by-property-name data mapper picks it
 *      up. Two parameters resolving to the same flag is a programming error and throws.
 *   2. **Interactive fill** — a parameter that is absent and declares a `question` is asked
 *      for interactively, and the answer is filled in. This is gated by the
 *      `InteractiveParameters` configuration and only runs against an interactive terminal;
 *      otherwise the absent value is left for validation to report, unchanged.
 *
 * Parameters without a `@commandParameter` decorator are untouched, so commands that don't
 * use it pay nothing.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandParameterPrompter {
  constructor(
    private readonly cliPrompt: CliPrompt,
    @injectConfig(CliConfigurationKeys.InteractiveParameters) private readonly interactiveParametersEnabled: boolean,
  ) {
  }

  /**
   * Returns a copy of `rawArgs` with aliased flags bound to their property and any missing,
   * question-carrying parameters filled in interactively. The input object is never mutated
   * — the original command event payload stays intact.
   */
  async fillMissingParameters(optionsType: ClassConstructor<any>, rawArgs: Record<string, any>): Promise<Record<string, any>> {
    const args: Record<string, any> = {...rawArgs};

    const parameters = this.collectParameters(optionsType);
    if (parameters.length === 0) {
      return args;
    }

    for (const {propertyKey, flag, options} of parameters) {
      // Bind an aliased flag (`--flag`) onto the property name so the data mapper, which maps
      // by property name, resolves it. Only when the flag was actually passed.
      if (flag !== propertyKey && args[flag] !== undefined) {
        args[propertyKey] = args[flag];
      }

      const isPassed = args[propertyKey] !== undefined || args[flag] !== undefined;
      if (isPassed || options.question === undefined) {
        continue;
      }

      // Absent + a question to ask. Skip silently when prompting is turned off or there is no
      // interactive terminal to ask on — the missing value then falls through to validation.
      if (this.interactiveParametersEnabled !== true || this.isInputInteractive() === false) {
        continue;
      }

      const answer = (await this.cliPrompt.readLine(this.formatQuestion(options.question))).trim();
      if (answer.length > 0) {
        args[propertyKey] = answer;
      }
    }

    return args;
  }

  /**
   * Reads every `@commandParameter` off `optionsType`, resolving each to its effective flag
   * and detecting two parameters that would claim the same flag (a programming error).
   * @private
   */
  private collectParameters(optionsType: ClassConstructor<any>): Array<{propertyKey: string; flag: string; options: CommandParameterOptions}> {
    const properties = ClassMetadata.getInformation(optionsType).properties;

    const parameters: Array<{propertyKey: string; flag: string; options: CommandParameterOptions}> = [];
    const propertyByFlag = new Map<string, string>();

    for (const propertyKey of properties) {
      const options: CommandParameterOptions | undefined = PropertyMetadata.getMetadata(optionsType.prototype, propertyKey, CliDecoratorMetadataKeynameEnum.CommandParameter);
      if (options === undefined) {
        continue;
      }

      const flag = options.flag ?? propertyKey;

      const existing = propertyByFlag.get(flag);
      if (existing !== undefined) {
        throw new UsageError(
          `Command parameters '${existing}' and '${propertyKey}' on '${optionsType.name}' both bind to the flag '--${flag}'. Give one of them a distinct 'flag'.`,
          {
            code: CliErrorCode.CommandParameterFlagConflict,
            details: {targetType: optionsType.name, flag, properties: [existing, propertyKey]},
          },
        );
      }
      propertyByFlag.set(flag, propertyKey);

      parameters.push({propertyKey, flag, options});
    }

    return parameters;
  }

  /**
   * Whether stdin is an interactive terminal. Pulled out so the gate is easy to reason about
   * (and to stub in tests) — there is no point asking a question when input is piped or runs
   * under CI, where a read would either hang or return EOF.
   * @private
   */
  private isInputInteractive(): boolean {
    return process.stdin.isTTY === true;
  }

  /**
   * Ensures the rendered question ends with a trailing space so the typed answer doesn't butt
   * up against the prompt text.
   * @private
   */
  private formatQuestion(question: string): string {
    return question.endsWith(" ") ? question : `${question} `;
  }
}
