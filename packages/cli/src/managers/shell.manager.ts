import {exec, spawn} from "child_process";
import {ConsoleManager} from "./console.manager";
import {injectable} from "tsyringe";
import {PathManager} from "./path.manager";

@injectable()
export class ShellManager {
    constructor(private readonly consoleManager: ConsoleManager, private readonly pathManager: PathManager) {
    }

    execute(command: string, options?: {
        directory?: string,
        streamStdout?: boolean,
        maxBuffer?: number,
    }): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const env = process.env;
            let finalCommand = command;

            const streamStdout = options?.streamStdout ?? false;
            const directory = options?.directory;

            if(directory) {
                const absoluteDirectory = this.pathManager.getPathRelativeToCurrentExecutionDirectory(directory);
                finalCommand = "cd " + absoluteDirectory + " && " + command;
            }

            this.consoleManager.writeLine(finalCommand);

            if(streamStdout) {
                const child = spawn(finalCommand, [], { shell: true, env });
                child.stdout.on('data', (data) => {
                    this.consoleManager.writeLine(`${data}`);
                });

                child.stderr.on('data', (data) => {
                    this.consoleManager.writeLine(`Stderr: ${data}`);
                });

                child.on('close', (code) => {
                    this.consoleManager.writeLine(`Command exited with code ${code}`);

                    if(code !== 0) {
                        return reject(code);
                    }

                    return resolve(code + "");
                });
            }

            return exec(finalCommand, {env, maxBuffer: options?.maxBuffer}, (error, stdout, stderr) => {
                if (error && error.code) {
                    this.consoleManager.writeLine("Error: " + error.message);
                    return reject(error);
                }

                if (stderr) {
                    this.consoleManager.writeLine("Stderr: " + stderr);
                    return resolve(stderr);
                }

                this.consoleManager.writeLine(stdout);
                return resolve(stdout);
            })
        })
    }
}