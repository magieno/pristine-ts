import {inject, injectable, injectAll} from "tsyringe";
import {Event, EventHandlerInterface} from "@pristine-ts/core";
import {CommandEventPayload} from "../event-payloads/command.event-payload";
import {CommandEvent} from "../types/command-event.type";
import {CommandEventResponse} from "../types/command-event-response.type";
import {CommandInterface} from "../interfaces/command.interface";
import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {CommandNotFoundError} from "../errors/command-not-found.error";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CliModuleKeyname} from "../cli.module.keyname";
import {CommandArgumentResolver} from "../services/command-argument-resolver";

@tag(ServiceDefinitionTagEnum.EventHandler)
@moduleScoped(CliModuleKeyname)
@injectable()
export class CliEventHandler implements EventHandlerInterface<any, any> {
  constructor(
    @inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
    private readonly commandArgumentResolver: CommandArgumentResolver,
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
   * Maps + validates a command's raw arguments. Delegates to the shared
   * `CommandArgumentResolver` (also used by the interactive REPL) so both dispatch paths
   * resolve arguments identically.
   */
  async resolveArgs(command: CommandInterface<any>, rawArgs: any): Promise<any> {
    return this.commandArgumentResolver.resolve(command, rawArgs);
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
