import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Lists every registered command's name. Like `HelpCommand`, this resolves the command set
 * lazily inside `run()` via the injected `Kernel.container` to avoid the self-referential
 * cycle: ListCommand is itself `@tag(Command)`, so a constructor-time `@injectAll(Command)`
 * would recurse into itself.
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
    private readonly kernel: Kernel,
  ) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    this.consoleManager.writeLine("List of registered commands:");
    const commands: CommandInterface<any>[] = this.kernel.container.resolveAll(ServiceDefinitionTagEnum.Command);
    commands.forEach(command => this.consoleManager.writeLine(command.name));

    return ExitCodeEnum.Success;
  }
}
