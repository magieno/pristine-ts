import "reflect-metadata";
import {DependencyContainer, inject, injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {injectConfig, moduleScoped, ServiceDefinitionTagEnum, UsageError} from "@pristine-ts/common";
import {ClassMetadata, PropertyMetadata} from "@pristine-ts/metadata";
import {Validator} from "@pristine-ts/class-validator";
import {AutoDataMappingBuilderOptions, DataMapper} from "@pristine-ts/data-mapping";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliConfigurationKeys} from "../cli.configuration-keys";
import {CliPrompt} from "../managers/cli-prompt.manager";
import {CliOutput} from "../managers/cli-output.manager";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";
import {CommandParameterOptions} from "../options/command-parameter.options";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {BooleanAnswerParser} from "../utils/boolean-answer-parser";
import {CommandParameterChoicesList} from "../types/command-parameter-choices-list.type";
import {CommandParameterChoicesResolver} from "../types/command-parameter-choices-resolver.type";
import {CommandParameterChoicesContext} from "../interfaces/command-parameter-choices-context.interface";
import {CommandParameterChoicesProviderInterface} from "../interfaces/command-parameter-choices-provider.interface";

/**
 * Applies a command's `@commandParameter` metadata to its raw, parsed arguments before they are
 * mapped onto the options instance and validated. Two things happen here:
 *
 *   1. **Flag binding** — a parameter whose `flag` differs from its property name is copied from
 *      the flag key onto the property key, so the by-property-name data mapper picks it up. Two
 *      parameters resolving to the same flag is a programming error and throws.
 *   2. **Interactive fill** — a parameter that is absent and declares a `question` is asked for
 *      interactively. Values constrained to a set — an explicit `choices`, or an `@IsIn` /
 *      `@IsEnum` — are picked from an arrow-key menu; booleans answer `(y/n)`; everything else is
 *      a free-text answer coerced + validated through the same mapper/validator the command
 *      pipeline uses, re-asking on an invalid answer. Gated by the `InteractiveParameters`
 *      configuration and only run against an interactive terminal; otherwise the absent value is
 *      left for validation to report.
 *
 * Parameters without a `@commandParameter` decorator are untouched, so commands that don't use
 * it pay nothing.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandParameterPrompter {
  /**
   * `@pristine-ts/class-validator` stores its instantiated validators (one per `@IsX`
   * decorator) as an array under this property-metadata key. We read it only to surface enum
   * choices in the prompt; all actual validation goes through `Validator`.
   */
  private static readonly ClassValidatorMetadataKey = "pristine-validator:validator";

  /**
   * How many times a single value is re-asked before giving up and letting the missing /
   * invalid value fall through to the normal validation error. A bound (rather than an
   * unbounded loop) keeps a misconfigured validator that can never pass from hanging the CLI.
   */
  private static readonly MaxAttempts = 5;

  constructor(
    private readonly cliPrompt: CliPrompt,
    private readonly cliOutput: CliOutput,
    private readonly validator: Validator,
    private readonly dataMapper: DataMapper,
    @injectConfig(CliConfigurationKeys.InteractiveParameters) private readonly interactiveParametersEnabled: boolean,
    // The current child container, used solely to instantiate a `choices` provider *class*
    // named on a decorator (see `resolveChoicesList`). Constructor-injected — only the late
    // instantiation of an author-named provider is deferred, mirroring HelpCommand.
    @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer,
  ) {
  }

  /**
   * Returns a copy of `rawArgs` with aliased flags bound to their property and any missing,
   * question-carrying parameters filled in interactively. The input object is never mutated —
   * the original command event payload stays intact.
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

      const value = await this.promptForValue(optionsType, propertyKey, flag, options, args);
      if (value !== undefined) {
        args[propertyKey] = value;
      }
    }

    return args;
  }

  /**
   * Reads every `@commandParameter` off `optionsType`, resolving each to its effective flag and
   * detecting two parameters that would claim the same flag (a programming error).
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
   * Asks for a single parameter's value, rendering and validating it according to the property's
   * declared type:
   *
   *   - sensitive values are read with the input masked and never trimmed;
   *   - a constrained value (explicit `choices`, or `@IsIn` / `@IsEnum`) is picked from an
   *     arrow-key menu, then coerced + validated like any typed value;
   *   - booleans render as `(y/n)` and accept y/yes/true/1 & n/no/false/0;
   *   - every other answer is coerced (via the data mapper) and validated (via the validator)
   *     exactly as a typed flag would be, re-asking with the real constraint message when it
   *     doesn't pass.
   *
   * Returns the coerced value, or `undefined` when the user enters nothing or the attempt budget
   * is exhausted — in which case the absent value falls through to validation.
   * @private
   */
  private async promptForValue(optionsType: ClassConstructor<any>, propertyKey: string, flag: string, options: CommandParameterOptions, args: Record<string, any>): Promise<any> {
    const sensitive = options.sensitive === true;
    const isBoolean = sensitive === false && Reflect.getMetadata("design:type", optionsType.prototype, propertyKey) === Boolean;

    // A constrained value is selected from an arrow-key menu, then coerced + validated the same
    // way a typed flag would be. Secrets and booleans are never menus.
    const menu = (sensitive || isBoolean) ? undefined : await this.resolveChoices(optionsType, propertyKey, flag, options, args);
    if (menu !== undefined) {
      const selected = await this.cliPrompt.select(this.menuMessage(options.question, flag), menu);
      const outcome = await this.coerceAndValidate(optionsType, propertyKey, selected);
      return outcome.valid ? outcome.value : selected;
    }

    const prompt = this.formatQuestion(this.decorateQuestion(options.question ?? "", isBoolean, undefined));

    for (let attempt = 0; attempt < CommandParameterPrompter.MaxAttempts; attempt++) {
      // Secrets go through the masked reader and are never trimmed (a password may legitimately
      // contain surrounding whitespace); ordinary answers are trimmed.
      const raw = sensitive
        ? await this.cliPrompt.readSecret(prompt)
        : (await this.cliPrompt.readLine(prompt)).trim();

      // Nothing entered → leave the value unset so validation reports it (and a required field
      // surfaces the same way it would have without a prompt).
      if (raw.length === 0) {
        return undefined;
      }

      if (isBoolean) {
        const parsed = BooleanAnswerParser.parse(raw);
        if (parsed === undefined) {
          this.cliOutput.writeLine("Please answer yes (y) or no (n).");
          continue;
        }
        return parsed;
      }

      const outcome = await this.coerceAndValidate(optionsType, propertyKey, raw);
      if (outcome.valid) {
        return outcome.value;
      }
      for (const message of outcome.messages ?? []) {
        this.cliOutput.writeLine(message);
      }
    }

    this.cliOutput.writeLine(`No valid value provided after ${CommandParameterPrompter.MaxAttempts} attempts.`);
    return undefined;
  }

  /**
   * Resolves this parameter's selectable choices to a `{name, value}[]` menu, or `undefined`
   * when it has none (free-text). Sources, in order: an explicit `@commandParameter({choices})`
   * — a static list, a resolver function, or a DI provider class — else the `@IsIn` / `@IsEnum`
   * set. An empty result is treated as "no menu".
   * @private
   */
  private async resolveChoices(optionsType: ClassConstructor<any>, propertyKey: string, flag: string, options: CommandParameterOptions, args: Record<string, any>): Promise<Array<{name: string; value: string}> | undefined> {
    const list = await this.resolveChoicesList(optionsType, propertyKey, flag, options, args);
    if (list === undefined || list.length === 0) {
      return undefined;
    }
    return list.map((choice) => typeof choice === "string" ? {name: choice, value: choice} : {name: choice.name, value: choice.value});
  }

  /**
   * The raw choices list from the declared `choices` (static array / resolver function / DI
   * provider class), falling back to the enum/`@IsIn` set when none is declared. Dynamic
   * resolution failures degrade to free-text rather than crashing the prompt.
   * @private
   */
  private async resolveChoicesList(optionsType: ClassConstructor<any>, propertyKey: string, flag: string, options: CommandParameterOptions, args: Record<string, any>): Promise<CommandParameterChoicesList | undefined> {
    const declared = options.choices;

    // No explicit choices → the enum/`@IsIn` set (back-compat), which now drives a menu rather
    // than a `(a/b/c)` text hint.
    if (declared === undefined) {
      return this.getChoices(optionsType, propertyKey);
    }

    if (Array.isArray(declared)) {
      return declared;
    }

    const context: CommandParameterChoicesContext = {args, propertyKey, flag};
    try {
      // A class constructor (DI provider) is distinguishable from a plain resolver function by
      // its prototype carrying `getChoices`.
      if (this.isChoicesProviderClass(declared)) {
        // ── container.resolve, justified ───────────────────────────────────────────────────
        // The provider class is named on the `@commandParameter` decorator at definition time;
        // only at prompt time can we turn it into an instance (so it can inject a FileManager,
        // HttpClient, …). Mirrors HelpCommand's late command resolution — the child container is
        // constructor-injected, only the instantiation is deferred.
        const provider = this.container.resolve(declared) as CommandParameterChoicesProviderInterface;
        return await provider.getChoices(context);
      }
      return await (declared as CommandParameterChoicesResolver)(context);
    } catch {
      this.cliOutput.writeLine(`Could not load choices for '${flag}'; enter the value directly.`);
      return undefined;
    }
  }

  /**
   * Whether `candidate` is a provider *class* (vs a plain resolver function): a class carries a
   * prototype with a `getChoices` method; an arrow/plain resolver does not.
   * @private
   */
  private isChoicesProviderClass(candidate: any): candidate is ClassConstructor<CommandParameterChoicesProviderInterface> {
    return typeof candidate === "function" && candidate.prototype != null && typeof candidate.prototype.getChoices === "function";
  }

  /**
   * The menu heading: the parameter's `question` when set, else a neutral `Select <flag>`.
   * @private
   */
  private menuMessage(question: string | undefined, flag: string): string {
    const text = (question ?? "").trim();
    return text.length > 0 ? text : `Select ${flag}`;
  }

  /**
   * Maps a single raw answer onto a probe instance of `optionsType` and validates just that
   * property, returning the coerced value when it passes or the constraint messages when it
   * doesn't. Reuses the same mapper + validator the command pipeline uses, so coercion and
   * constraints behave identically whether a value was typed as a flag or answered here.
   * @private
   */
  private async coerceAndValidate(optionsType: ClassConstructor<any>, propertyKey: string, raw: string): Promise<{valid: boolean; value?: any; messages?: string[]}> {
    let probe: any;
    try {
      probe = await this.dataMapper.autoMap({[propertyKey]: raw}, optionsType, new AutoDataMappingBuilderOptions({throwOnErrors: false}));
    } catch {
      return {valid: false, messages: [`'${raw}' could not be interpreted — please try again.`]};
    }

    const validationErrors = await this.validator.validate(probe);
    const propertyErrors = validationErrors.filter((error) => error.property === propertyKey);
    if (propertyErrors.length === 0) {
      return {valid: true, value: probe[propertyKey]};
    }

    return {valid: false, messages: this.describeErrors(propertyErrors)};
  }

  /**
   * Flattens `class-validator`'s per-property constraint objects into plain, user-facing lines.
   * `@pristine-ts/class-validator` stores each constraint as `{keyname, message}` rather than a
   * bare string, so prefer `.message`, falling back so we never print `[object Object]`.
   * @private
   */
  private describeErrors(errors: any[]): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      for (const key in error.constraints) {
        const constraint = error.constraints[key];
        const message = typeof constraint === "string"
          ? constraint
          : (constraint && typeof constraint === "object" && typeof constraint.message === "string")
            ? constraint.message
            : JSON.stringify(constraint);
        messages.push(message);
      }
    }
    return messages.length > 0 ? messages : ["Invalid value — please try again."];
  }

  /**
   * The allowed values declared by an `@IsIn([...])` or `@IsEnum(Enum)` on the property, for
   * display in the prompt. Reads `@pristine-ts/class-validator`'s stored validator instances
   * defensively — any shape mismatch just yields no menu (validation still rejects bad input and
   * re-asks). Returns undefined when the property isn't enum-constrained.
   * @private
   */
  private getChoices(optionsType: ClassConstructor<any>, propertyKey: string): string[] | undefined {
    const validators = PropertyMetadata.getMetadata(optionsType.prototype, propertyKey, CommandParameterPrompter.ClassValidatorMetadataKey);
    if (Array.isArray(validators) === false) {
      return undefined;
    }

    for (const validator of validators) {
      if (validator === null || validator === undefined || typeof validator.getConstraints !== "function") {
        continue;
      }

      let constraints: any;
      try {
        constraints = validator.getConstraints();
      } catch {
        continue;
      }

      if (Array.isArray(constraints?.possibleValues)) {
        return constraints.possibleValues.map((value: unknown) => String(value));
      }
      if (constraints?.entity !== null && typeof constraints?.entity === "object") {
        return Object.keys(constraints.entity).map((key) => String(constraints.entity[key]));
      }
    }

    return undefined;
  }

  /**
   * Appends a type hint to the question: `(y/n)` for booleans, `(a/b/c)` for enum choices.
   * @private
   */
  private decorateQuestion(question: string, isBoolean: boolean, choices: string[] | undefined): string {
    if (isBoolean) {
      return `${question} (y/n)`;
    }
    if (choices !== undefined && choices.length > 0) {
      return `${question} (${choices.join("/")})`;
    }
    return question;
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
   * Ensures the rendered question ends with a trailing space so the typed answer doesn't butt up
   * against the prompt text.
   * @private
   */
  private formatQuestion(question: string): string {
    return question.endsWith(" ") ? question : `${question} `;
  }
}
