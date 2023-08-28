import {exec} from "child_process";

describe('CLI - Launch command',  () => {
    it("should properly launch a command", () => {
        // Launch the sample command
        // todo: make sure the help and list commands can be successfully launched.

        return new Promise<void>((resolve, reject) => {
            exec("npm run cli", (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    expect(false).toBeTruthy();
                    return reject();
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    expect(false).toBeTruthy();
                    return reject();
                }
                console.log(`stdout: ${stdout}`);

                expect(error).toBeNull();
                return resolve();
            });
        })
    })
});