import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable, injectAll} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";

@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class ListCommand implements CommandInterface<null>{
    constructor(
        private readonly consoleManager: ConsoleManager,
        @injectAll(ServiceDefinitionTagEnum.Command) private readonly commands: CommandInterface<any>[]) {
    }

    options = null;
    name = "list";

    async run(args: any): Promise<ExitCodeEnum | number> {
        this.consoleManager.writeLine("List of registered commands:");
        this.commands.forEach(command => this.consoleManager.writeLine(command.name));

        return ExitCodeEnum.Success;
    }
}