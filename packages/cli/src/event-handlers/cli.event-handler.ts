import {inject, injectable, injectAll} from "tsyringe";
import {Event, EventHandlerInterface} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {CommandEvent} from "../types/command-event.type";
import {CommandEventResponse} from "../types/command-event-response.type";
import {CommandInterface} from "../interfaces/command.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag, UsageError, ValidationError, ExitCode} from "@pristine-ts/common";
import {CliErrorCode} from "../errors/cli-error-code.enum";
import {CommandNotFoundError} from "../errors/command-not-found.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Validator} from "@pristine-ts/class-validator";
import {CliModuleKeyname} from "../cli.module.keyname";
import {plainToInstance} from "class-transformer";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CliEventHandler implements EventHandlerInterface<any, any> {
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly validator: Validator,
    @injectAll(ServiceDefinitionTagEnum.Command) private readonly commands: CommandInterface<any>[]) {
  }

  async handle(event: CommandEvent): Promise<CommandEventResponse> {
    const command = this.commands.find(c => c.name === event.payload.name);
    if (command === undefined) {
      // Throws a UsageError (exit 64, `EX_USAGE`). The bin's `.catch` will route it
      // through `CliErrorReporter.report` which prints a clean one-line stderr and
      // exits with the right code — no `process.exit` in this method any longer.
      throw new CommandNotFoundError(event.payload.name);
    }

    const args = await this.resolveArgs(command, event.payload.arguments ?? {});
    const exitCode = await command.run(args);
    this.logExitStatus(event.payload.name, exitCode);
    process.exit(exitCode);
  }

  /**
   * Maps `rawArgs` (the parsed argv shape produced by `CommandEventMapper`) into a typed
   * instance of `command.optionsType`, then runs `class-validator` against the instance.
   *
   * For commands that opt out of typed options (`optionsType === null`), passes the raw
   * args through unchanged — the legacy escape hatch for commands that want to handle
   * argv parsing themselves.
   *
   * Throws `UsageError` for mapping failures and `ValidationError` for class-validator
   * failures. Both carry structured `details` so `CliErrorReporter` can render them as
   * readable stderr lines without this method touching the console directly.
   */
  async resolveArgs(command: CommandInterface<any>, rawArgs: any): Promise<any> {
    if (command.optionsType === null) {
      return rawArgs;
    }

    let mapped: any;
    try {
      // class-transformer's plainToInstance is what produces a real instance of the
      // options class (with the prototype, decorator metadata, and class-validator hooks
      // intact). DataMapper.autoMap would return a plain object instead, which causes
      // class-validator to silently report no errors because it can't find decorator
      // metadata on a non-instance — exactly the bug this rewrite fixes.
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

  supports(event: Event<any>): boolean {
    return event.payload instanceof CommandEventPayload;
  }

  private logExitStatus(commandName: string, exitCode: ExitCode | number): void {
    const status = exitCode === ExitCode.Success ? "Success" : "Error";
    if (exitCode === ExitCode.Success) {
      this.logHandler.info(`Command '${commandName}' exited`, {highlights: {status, exitCode, commandName}});
    } else {
      this.logHandler.error(`Command '${commandName}' exited`, {highlights: {status, exitCode, commandName}});
    }
  }
}
