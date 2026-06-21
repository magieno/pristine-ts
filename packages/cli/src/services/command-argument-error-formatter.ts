import {injectable} from "tsyringe";
import {ClassConstructor} from "class-transformer";
import {moduleScoped, UsageError} from "@pristine-ts/common";
import {PropertyMetadata} from "@pristine-ts/metadata";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CliDecoratorMetadataKeynameEnum} from "../enums/cli-decorator-metadata-keyname.enum";
import {CommandParameterOptions} from "../options/command-parameter.options";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {CommandUsageRenderer} from "./command-usage-renderer";

/**
 * Turns `@pristine-ts/class-validator`'s raw per-property validation output into a single,
 * clean, user-facing `UsageError` (exit 64, rendered verbatim via `options.plain`) instead of
 * a `[CONSTRAINT_KEY]`-prefixed dump:
 *
 *   - if any *required* parameter is missing → the command's `Usage:` synopsis, so the user
 *     sees what to pass (and not a wall of "is not a string" noise for an absent value);
 *   - otherwise (values present but invalid) → one line per offending value: the parameter's
 *     `errorMessage` (verbatim, `%value%`/`%flag%` filled), or a generated
 *     `Invalid <flag> '<value>'. <validator message>` with the constraint-key prefix and
 *     definedness noise stripped.
 *
 * Returns the error rather than throwing it, so the resolver keeps the `throw` (clean control
 * flow) and tests can assert on the built error directly.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CommandArgumentErrorFormatter {
  /**
   * Constraint keynames that only trip because a value is *absent*. For a present-but-invalid
   * value these never fire, so we drop them and surface the semantic constraint (e.g.
   * `MATCHES`) the user actually needs — never "is not a string" for a value they gave.
   */
  private static readonly DefinednessConstraints = new Set(["IS_DEFINED", "IS_NOT_EMPTY", "IS_STRING"]);

  constructor(
    private readonly usageRenderer: CommandUsageRenderer,
  ) {
  }

  /**
   * Builds the `UsageError` for a set of validation errors. `mapped` is the (failed) options
   * instance — read to get each property's effective value and to tell "missing" (undefined /
   * empty) from "present but invalid".
   */
  buildValidationError(
    optionsType: ClassConstructor<any>,
    mapped: Record<string, any>,
    validationErrors: any[],
    context: {commandName: string; binName: string},
  ): UsageError {
    const missing = validationErrors.filter((error) => this.isMissing(mapped[error.property]));
    if (missing.length > 0) {
      return new UsageError(this.usageRenderer.render(optionsType, context.commandName, context.binName), {
        code: CliErrorCode.MissingRequiredArgument,
        plain: true,
        details: {missing: missing.map((error) => this.flagFor(optionsType, error.property)).join(", ")},
      });
    }

    const lines = validationErrors.map((error) => this.invalidLine(optionsType, mapped, error));
    return new UsageError(lines.join("\n"), {
      code: CliErrorCode.InvalidArgument,
      plain: true,
    });
  }

  /** A value counts as "missing" when it never arrived — undefined/null or an empty string. */
  private isMissing(value: any): boolean {
    return value === undefined || value === null || value === "";
  }

  /**
   * One line for an offending value. A parameter's `errorMessage` is the *entire* line, used
   * verbatim (with `%value%`/`%flag%` filled); otherwise we generate
   * `Invalid <flag> '<value>'. <validator message>`. Sensitive parameters never echo the value
   * (it is `<hidden>`, even inside a custom template).
   * @private
   */
  private invalidLine(optionsType: ClassConstructor<any>, mapped: Record<string, any>, error: any): string {
    const options = this.optionsFor(optionsType, error.property);
    const flag = options?.flag ?? error.property;
    const sensitive = options?.sensitive === true;
    const value = sensitive ? "<hidden>" : String(mapped[error.property]);

    if (options?.errorMessage) {
      return options.errorMessage.replace(/%value%/g, value).replace(/%flag%/g, flag);
    }

    const reason = this.validatorMessage(error);
    return sensitive ? `Invalid ${flag}. ${reason}` : `Invalid ${flag} '${value}'. ${reason}`;
  }

  /**
   * The validator's own message for a present-but-invalid value: the first *semantic* constraint
   * message (definedness noise dropped), falling back to the first message present.
   * @private
   */
  private validatorMessage(error: any): string {
    const messages = this.constraintMessages(error);
    return messages.semantic ?? messages.fallback ?? "Invalid value.";
  }

  /**
   * Splits an error's constraint messages into the first *semantic* one (not a definedness
   * constraint) and a plain first-seen fallback. Reads `@pristine-ts/class-validator`'s
   * `{keyname, message}` constraint objects defensively.
   * @private
   */
  private constraintMessages(error: any): {semantic?: string; fallback?: string} {
    let semantic: string | undefined;
    let fallback: string | undefined;

    for (const keyname in error.constraints) {
      const message = this.extractMessage(error.constraints[keyname]);
      if (message === undefined) {
        continue;
      }
      if (fallback === undefined) {
        fallback = message;
      }
      if (semantic === undefined && CommandArgumentErrorFormatter.DefinednessConstraints.has(keyname.toUpperCase()) === false) {
        semantic = message;
      }
    }

    return {semantic, fallback};
  }

  /** Pulls the human message out of a `{keyname, message}` constraint (or a bare string). */
  private extractMessage(constraint: any): string | undefined {
    if (typeof constraint === "string") {
      return constraint;
    }
    if (constraint && typeof constraint === "object" && typeof constraint.message === "string") {
      return constraint.message;
    }
    return undefined;
  }

  private optionsFor(optionsType: ClassConstructor<any>, propertyKey: string): CommandParameterOptions | undefined {
    return PropertyMetadata.getMetadata(optionsType.prototype, propertyKey, CliDecoratorMetadataKeynameEnum.CommandParameter);
  }

  private flagFor(optionsType: ClassConstructor<any>, propertyKey: string): string {
    return this.optionsFor(optionsType, propertyKey)?.flag ?? propertyKey;
  }
}
