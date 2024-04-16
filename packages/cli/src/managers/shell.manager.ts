import {exec, spawn} from "child_process";
import {ConsoleManager} from "./console.manager";
import {injectable} from "tsyringe";
import {PathManager} from "./path.manager";
import {DateUtil} from "@pristine-ts/common"

@injectable()
export class ShellManager {
    constructor(private readonly consoleManager: ConsoleManager,
                private readonly pathManager: PathManager,
                private readonly dateUtil: DateUtil) {
    }

    execute(command: string, options?: {
        directory?: string,
        streamStdout?: boolean,
        maxBuffer?: number,
        outputStdout?: boolean,
        outputStderr?: boolean,
        outputDuration?: boolean,
        outputTimeBeforeExecutingCommand?: boolean,
    }): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const env = process.env;
            let finalCommand = command;

            const streamStdout = options?.streamStdout ?? false;
            const directory = options?.directory;

            const outputStdout = options?.outputStdout ?? true;
            const outputStderr = options?.outputStderr ?? true;
            const outputDuration = options?.outputDuration ?? true;
            const outputTimeBeforeExecutingCommand = options?.outputTimeBeforeExecutingCommand ?? true;

            if(directory) {
                const absoluteDirectory = this.pathManager.getPathRelativeToCurrentExecutionDirectory(directory);
                finalCommand = "cd " + absoluteDirectory + " && " + command;
            }

            const start = new Date();

            if(outputTimeBeforeExecutingCommand) {
                this.consoleManager.writeLine(start.toISOString() + ": " + finalCommand);
            } else {
                outputStdout && this.consoleManager.writeLine(finalCommand);
            }


            if(streamStdout) {
                const child = spawn(finalCommand, [], { shell: true, env });
                child.stdout.on('data', (data) => {
                    outputStdout && this.consoleManager.writeLine(`${data}`);
                });

                child.stderr.on('data', (data) => {
                    outputStderr && this.consoleManager.writeLine(`Stderr: ${data}`);
                });

                child.on('close', (code) => {
                    outputStdout && this.consoleManager.writeLine(`Command exited with code ${code}`);

                    if(code !== 0) {
                        return reject(code);
                    }

                    // Output the duration in human readable format
                    if(outputDuration) {
                        const end = new Date();
                        const duration = end.getTime() - start.getTime();
                        this.consoleManager.writeLine(`Executed in: ${this.dateUtil.formatDuration(duration)}`);
                    }

                    return resolve(code + "");
                });
            }

            return exec(finalCommand, {env, maxBuffer: options?.maxBuffer}, (error, stdout, stderr) => {
                if (error && error.code) {
                    outputStderr && this.consoleManager.writeLine("Error: " + error.message);
                }

                if (stderr) {
                    outputStderr && this.consoleManager.writeLine("Stderr: " + stderr);
                }

                outputStdout && this.consoleManager.writeLine(stdout);

                if(error && error.code) {
                    return reject(error);
                } else if(stderr) {
                    return resolve(stderr);
                }

                return resolve(stdout);
            })
        })
    }
}
