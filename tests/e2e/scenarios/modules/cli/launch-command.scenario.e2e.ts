import {exec} from "child_process";
import {bootstrap} from "./cli";

describe('CLI - Launch command',  () => {
    it("should properly launch a command", () => {
        // Launch the sample command
        // todo: make sure the help and list commands can be successfully launched.

        bootstrap();

        return new Promise<void>((resolve, reject) => {
            exec("ts-node -p tsconfig.e2e.json scenarios/modules/cli/cli.ts help", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                console.log(`stdout: ${stdout}`);

                resolve();
            });
        })
    })
});