import {injectable} from "tsyringe";

@injectable()
export class ConsoleManager {
    write(message: string) {}

    writeLine(message: string) {}
}