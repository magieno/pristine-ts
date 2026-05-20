import {ChildProcessWithoutNullStreams, exec, spawn} from "child_process";
import {inject, injectable} from "tsyringe";
import {PathManager} from "@pristine-ts/core";
import {DateUtil} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";

@injectable()
export class ShellManager {
  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface,
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
    childProcessHandleCallback?: (childProcessHandle: ChildProcessWithoutNullStreams) => void
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

      if (directory) {
        const absoluteDirectory = this.pathManager.getPathRelativeToCurrentExecutionDirectory(directory);
        finalCommand = "cd " + absoluteDirectory + " && " + command;
      }

      const start = new Date();

      // Pretty/Simple output modes already render a timestamp; pass the command alone and
      // let the formatter handle the prefix. `outputTimeBeforeExecutingCommand` is now a
      // pass/skip flag — when false we still emit the command if stdout is enabled.
      if (outputTimeBeforeExecutingCommand) {
        this.logHandler.info(finalCommand);
      } else if (outputStdout) {
        this.logHandler.info(finalCommand);
      }


      if (streamStdout) {
        const child = spawn(finalCommand, [], {shell: true, env});
        child.stdout.on('data', (data) => {
          outputStdout && this.logHandler.info(`${data}`);
        });

        child.stderr.on('data', (data) => {
          outputStderr && this.logHandler.warning(`Stderr: ${data}`);
        });

        child.on("error", (error) => {
          this.logHandler.error(`Error: ${error.message}`);

          return reject(error);
        })

        child.on("exit", (code) => {
          outputStdout && this.logHandler.info(`Exit (code: ${code}).`);

          if(code !== 0) {
            return reject(code);
          }

          if (outputDuration) {
            const end = new Date();
            const duration = end.getTime() - start.getTime();
            this.logHandler.info(`Executed in: ${this.dateUtil.formatDuration(duration)}`);
          }

          return resolve(code + "");
        })

        child.on("disconnect", () => {
          outputStdout && this.logHandler.warning(`Disconnect.`);

          return reject("Disconnected");
        })

        child.on('close', (code) => {
          outputStdout && this.logHandler.info(`Command exited with code ${code}`);

          if (code !== 0) {
            return reject(code);
          }

          // Output the duration in human readable format
          if (outputDuration) {
            const end = new Date();
            const duration = end.getTime() - start.getTime();
            this.logHandler.info(`Executed in: ${this.dateUtil.formatDuration(duration)}`);
          }

          return resolve(code + "");
        });

        options?.childProcessHandleCallback?.(child);
        return;
      }

      return exec(finalCommand, {env, maxBuffer: options?.maxBuffer}, (error, stdout, stderr) => {
        if (error && error.code) {
          outputStderr && this.logHandler.error("Error: " + error.message);
        }

        if (stderr) {
          outputStderr && this.logHandler.warning("Stderr: " + stderr);
        }

        outputStdout && this.logHandler.info(stdout);

        // Output the duration in human readable format
        if (outputDuration) {
          const end = new Date();
          const duration = end.getTime() - start.getTime();
          this.logHandler.info(`Executed in: ${this.dateUtil.formatDuration(duration)}`);
        }

        if (error && error.code) {
          return reject(error);
        } else if (stderr) {
          return resolve(stderr);
        }

        return resolve(stdout);
      })
    })
  }
}
