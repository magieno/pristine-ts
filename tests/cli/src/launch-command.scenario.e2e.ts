import {exec} from "child_process";

describe('CLI - Launch command',  () => {
    it("should properly launch a command", () => {
        // Launch the sample command
        return new Promise<void>((resolve, reject) => {
            exec("npm run sample", (error, stdout, stderr) => {
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