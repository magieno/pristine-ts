import {moduleScoped, ServiceDefinitionTagEnum, tag, ExitCode} from "@pristine-ts/common";
import {DependencyContainer, inject, injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Lists every registered command's name. Like `HelpCommand`, this resolves the command set
 * lazily inside `run()` via the injected child container to avoid the self-referential cycle
 * that constructor-time `@injectAll(Command)` would create — see `HelpCommand` for details.
 */
@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ListCommand implements CommandInterface<null> {
  optionsType = null;
  name = "p:list";
  description = "List every registered command (built-in and custom).";

  constructor(
    private readonly consoleManager: ConsoleManager,
    @inject(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer,
  ) {
  }

  async run(args: any): Promise<ExitCode | number> {
    this.consoleManager.writeLine("List of registered commands:");
    // ── container.resolveAll, justified ─────────────────────────────────────────
    // Per CLAUDE.md: constructor-time `@injectAll(Command)` would create a self-
    // referential cycle since `ListCommand` is itself a `Command`-tagged service.
    // The lazy resolve breaks the cycle. The child container is constructor-
    // injected (not reached through `container.resolve("..Container")`), so the
    // container itself is still acquired via proper DI — only the enumeration is
    // late-bound.
    const commands: CommandInterface<any>[] = this.container.resolveAll(ServiceDefinitionTagEnum.Command);
    commands.forEach(command => this.consoleManager.writeLine(command.name));

    return ExitCode.Success;
  }
}
