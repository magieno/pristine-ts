import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";

@injectable()
@moduleScoped(CliModuleKeyname)
export class ConsoleManager {
    write(message: string) {
        process.stdout.write(message);
    }

    writeLine(message: string) {
        this.write(message + "\n");
    }
}