import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {DependencyContainer, injectable, injectAll} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class ListCommand implements CommandInterface<null> {
  optionsType = null;
  name = "list";

  constructor(
    private readonly consoleManager: ConsoleManager,
    @injectAll(ServiceDefinitionTagEnum.CurrentChildContainer) private readonly container: DependencyContainer) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    this.consoleManager.writeLine("List of registered commands:");
    const commands: CommandInterface<any>[] = this.container.resolveAll(ServiceDefinitionTagEnum.Command);
    commands.forEach(command => this.consoleManager.writeLine(command.name));

    return ExitCodeEnum.Success;
  }
}