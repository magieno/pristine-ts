import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import * as readline from 'node:readline/promises';
import {moveCursor} from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import {ConsoleReadlineOptions} from "../options/console-readline.options";

@injectable()
@moduleScoped(CliModuleKeyname)
export class ConsoleManager {
    write(message: string) {
        process.stdout.write(message);
    }

    writeLine(message: string) {
        this.write(message + "\n");
    }

    writeTable(table: any[]) {
        console.table(table);
    }

    read(): string {
        return process.stdin.read() as string;
    }

    async readLine(question: string, options: ConsoleReadlineOptions = new ConsoleReadlineOptions()): Promise<string> {
        const rl = readline.createInterface({ input, output });

        const answer: string = await rl.question(question);

        if(!options.showCharactersOnTyping) {
            moveCursor(output, 0, -1);
        }

        rl.close();

        return answer;
    }
}