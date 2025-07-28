import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";
import {CliModuleKeyname} from "../cli.module.keyname";

@tag(ServiceDefinitionTagEnum.Command)
@moduleScoped(CliModuleKeyname)
@injectable()
export class HelpCommand implements CommandInterface<null> {
  optionsType = null;

  name = "help";

  constructor(private readonly consoleManager: ConsoleManager) {
  }

  async run(args: any): Promise<ExitCodeEnum | number> {
    this.consoleManager.writeLine("Pristine CLI Module (help)");
    this.consoleManager.writeLine("")
    this.consoleManager.writeLine("To implement your own command:")
    this.consoleManager.writeLine("  1- Implement the 'CommandInterface' from '@pristine-ts/cli'");
    this.consoleManager.writeLine("  2- Tag it with the `@tag(ServiceDefinitionTagEnum.Command)` decorator");
    this.consoleManager.writeLine("  3- Modify your package.json file to include the path to your COMPILED js module: `{'pristine': { 'appModule': { 'cjsPath': 'RELATIVE_PATH_TO_YOUR_MODULE_COMPILE_FOR_CJS'}}}`")
    this.consoleManager.writeLine("  4- Add your command to the `package.json` such as `'scripts': { 'my_command': 'pristine YOUR_COMMAND_HERE YOUR_ARGUMENTS_HERE'}`");
    this.consoleManager.writeLine("  5- Execute your command.")

    return ExitCodeEnum.Success;
  }
}