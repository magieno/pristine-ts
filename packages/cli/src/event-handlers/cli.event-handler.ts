import {DependencyContainer, inject, injectable} from "tsyringe";
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
    @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer) {
  }

  /**
   * Resolves and runs the command, then **returns** its exit code wrapped in a
   * `CommandEventResponse` — it does not call `process.exit`.
   *
   * Process lifecycle is the bin's job: `kernel.handle` resolves with this exit code,
   * `Cli.bootstrap` returns it, and `bin.ts` does the actual `process.exit`. Returning
   * (rather than exiting) is also what lets the interactive REPL dispatch commands
   * through this very handler — `kernel.handle(argv, {keyname: Cli})` per typed line —
   * without the process dying after the first command.
   */
  async handle(event: CommandEvent): Promise<CommandEventResponse> {
    // ── container.resolveAll, justified ─────────────────────────────────────────
    // Per CLAUDE.md: constructor-time `@injectAll(ServiceDefinitionTagEnum.Command)` would
    // force-construct EVERY command the instant this handler is built. Because this handler is
    // itself an `EventHandler`, EventDispatcher's `@injectAll(EventHandler)` builds it (and thus
    // every command) during per-event dispatch — including in HTTP/Lambda apps, which import
    // CliModule transitively (HttpModule → CliModule) but never actually run a command. A single
    // command with an eager constructor (e.g. InfoCommand reading `__dirname`) would then crash
    // the whole runtime at first request. Resolving lazily here defers command construction to
    // the moment a command event is genuinely handled — which only happens on the CLI path,
    // where `supports()` matched a `CommandEventPayload`. The child container is
    // constructor-injected (registered by the kernel under `CurrentChildContainer`), so only the
    // enumeration is late-bound.
    const commands: CommandInterface<any>[] = this.container.resolveAll(ServiceDefinitionTagEnum.Command);

    const command = commands.find(c => c.name === event.payload.name);
    if (command === undefined) {
      // Throws a UsageError (exit 64, `EX_USAGE`). The bin's `.catch` will route it
      // through `CliErrorReporter.report` which prints a clean one-line stderr and
      // exits with the right code.
      throw new CommandNotFoundError(event.payload.name);
    }

    const args = await this.resolveArgs(command, event.payload.arguments ?? {});
    const exitCode = await command.run(args);
    this.logExitStatus(event.payload.name, exitCode);
    return new CommandEventResponse(event, exitCode);
  }

  /**
   * Maps + validates a command's raw arguments. Delegates to the shared
   * `CommandArgumentResolver`. Since the REPL dispatches through this same handler, the
   * one-shot CLI and the REPL resolve arguments through identical logic.
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
