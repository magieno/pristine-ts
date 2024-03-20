import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

@injectable()
@moduleScoped(CliModuleKeyname)
export class ConsoleManager {
    write(message: string) {
        process.stdout.write(message);
    }

    writeLine(message: string) {
        this.write(message + "\n");
    }

    read(): string {
        return process.stdin.read() as string;
    }

    async readLine(question: string): Promise<string> {
        const rl = readline.createInterface({ input, output });

        const answer: string = await rl.question(question);
        
        rl.close();

        return answer;
    }
}