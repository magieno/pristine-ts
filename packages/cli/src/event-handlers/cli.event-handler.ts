import {inject, injectable, injectAll} from "tsyringe";
import {Event, EventHandlerInterface} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {CommandEvent} from "../types/command-event.type";
import {CommandEventResponse} from "../types/command-event-response.type";
import {CommandInterface} from "../interfaces/command.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {CommandNotFoundError} from "../errors/command-not-found.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {Validator} from "@pristine-ts/class-validator";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";
import {plainToInstance} from "class-transformer";

/**
 * Resolution of a command's argv input. Either we successfully produced an instance of the
 * command's `optionsType` (or the raw args for null-optionsType commands) and `args` is set,
 * OR mapping/validation failed and `exitCode` carries the failure status. Mutually exclusive
 * by construction — `args` is undefined iff `exitCode` is set.
 *
 * Used as the return value of `CliEventHandler.resolveArgs` so the call site can branch on
 * the success/failure case without a thrown exception in the hot path.
 */
interface ResolvedCommandArgs {
  args?: any;
  exitCode?: ExitCodeEnum;
}

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CliEventHandler implements EventHandlerInterface<any, any> {
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly validator: Validator,
    private readonly consoleManager: ConsoleManager,
    @injectAll(ServiceDefinitionTagEnum.Command) private readonly commands: CommandInterface<any>[]) {
  }

  async handle(event: CommandEvent): Promise<CommandEventResponse> {
    const command = this.commands.find(c => c.name === event.payload.name);
    if (command === undefined) {
      throw new CommandNotFoundError(event.payload.name);
    }

    const resolution = await this.resolveArgs(command, event.payload.arguments ?? {});
    if (resolution.exitCode !== undefined) {
      // Mapping or validation failed. Already-rendered errors are on the console.
      this.logExitStatus(event.payload.name, resolution.exitCode);
      process.exit(resolution.exitCode);
    }

    const exitCode = await command.run(resolution.args);
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
   * Mapping or validation failures print the underlying error to the console and return an
   * `exitCode` so the caller can exit non-zero. Success returns the typed instance under
   * `args`. The two are mutually exclusive — see `ResolvedCommandArgs`.
   */
  async resolveArgs(command: CommandInterface<any>, rawArgs: any): Promise<ResolvedCommandArgs> {
    if (command.optionsType === null) {
      return {args: rawArgs};
    }

    let mapped: any;
    try {
      // class-transformer's plainToInstance is what produces a real instance of the
      // options class (with the prototype, decorator metadata, and class-validator hooks
      // intact). DataMapper.autoMap would return a plain object instead, which causes
      // class-validator to silently report no errors because it can't find decorator
      // metadata on a non-instance — exactly the bug this rewrite fixes.
      mapped = plainToInstance(command.optionsType, rawArgs);
    } catch (error) {
      this.consoleManager.writeError(
        `Failed to map CLI arguments to '${command.optionsType.name}': ${(error as Error).message}`,
      );
      return {exitCode: ExitCodeEnum.Error};
    }

    const validationErrors = await this.validator.validate(mapped);
    if (validationErrors.length === 0) {
      return {args: mapped};
    }

    for (const error of validationErrors) {
      this.consoleManager.writeLine(`Errors with argument '${error.property}'. The following constraints failed:`);
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
        this.consoleManager.writeLine(`\t- [${constraintKey}]: ${message}`);
      }
    }
    return {exitCode: ExitCodeEnum.Error};
  }

  supports(event: Event<any>): boolean {
    return event.payload instanceof CommandEventPayload;
  }

  private logExitStatus(commandName: string, exitCode: ExitCodeEnum | number): void {
    const status = exitCode === ExitCodeEnum.Success ? "Success" : "Error";
    this.consoleManager.writeLine(`[status:'${status}', code:'${exitCode}'] - Command '${commandName}' exited.`);
  }
}
