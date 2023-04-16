import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {injectable} from "tsyringe";
import {CommandInterface} from "../interfaces/command.interface";
import {ConsoleManager} from "../managers/console.manager";
import {ExitCodeEnum} from "../enums/exit-code.enum";

@tag(ServiceDefinitionTagEnum.Command)
@injectable()
export class HelpCommand implements CommandInterface<null>{
    options = null;

    name=  "help";

    constructor(private readonly consoleManager: ConsoleManager) {
    }

    async run(args: any): Promise<ExitCodeEnum | number> {
        this.consoleManager.writeLine("Pristine CLI Module (help)");

        return ExitCodeEnum.Success;
    }
}