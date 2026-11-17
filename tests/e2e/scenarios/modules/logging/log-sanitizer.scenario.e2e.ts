import "reflect-metadata";
import type {Response} from "@pristine-ts/common";

const JWT = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

/**
 * The log sanitizer through the real pipeline: a real Kernel, the real networking module (which
 * logs the headers and the body of every request) and the real console logger. The only fake is
 * the terminal: stdout and stderr are captured, and the secrets of the request must not be in them.
 *
 * Each kernel gets its own copy of the modules (`jest.resetModules`). Some services of the
 * framework are kept for the whole process, so a second kernel in the same process reuses the
 * LogHandler of the first, with the configuration of the first; a real application has one kernel.
 */
describe("Logging - the sanitizer keeps the secrets of a request out of the logs", () => {
    let written: string[];
    let stdoutSpy: jest.SpyInstance;
    let stderrSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.resetModules();
        written = [];
        const capture = (chunk: any) => {
            written.push(String(chunk));
            return true;
        };
        stdoutSpy = jest.spyOn(process.stdout, "write").mockImplementation(capture as any);
        stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(capture as any);
    });

    afterEach(() => {
        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
    });

    const send = async (configuration: { [key: string]: any }): Promise<{ response: Response, output: string }> => {
        // Loaded here, after `jest.resetModules`, so this kernel shares nothing with the one before.
        const {ExecutionContextKeynameEnum, Kernel} = require("@pristine-ts/core");
        const {HttpMethod, Request} = require("@pristine-ts/common");
        const {testModule} = require("../../../src/test.module");

        const kernel = new Kernel();
        await kernel.start(testModule, {
            "pristine.logging.consoleLoggerActivated": true,
            // Debug: every line the framework can write about a request is written.
            "pristine.logging.logSeverityLevelConfiguration": 0,
            ...configuration,
        });

        const request = new Request(HttpMethod.Post, "https://localhost:8080/api/2.0/magieno/pristine", "uuid");
        request.setHeaders({
            "Authorization": `Bearer ${JWT}`,
            "Cookie": "session=s3ss10n-c00k13",
            "X-Api-Key": "k3y-0f-th3-cl13nt",
            "X-Request-Source": "the-mobile-app",
        });
        request.body = {
            username: "jane",
            password: "hunter2-is-the-password",
            pairingCode: "11564104",
        };

        const response = await kernel.handle(request, {keyname: ExecutionContextKeynameEnum.Jest, context: {}}) as Response;
        // The console logger writes on a later tick.
        await new Promise(resolve => setTimeout(resolve, 200));

        return {response, output: written.join("")};
    };

    it("should write the request to the logs without its Authorization header, its cookie, its API key or its password", async () => {
        const {response, output} = await send({});

        // `pairingCode` is not a secret the framework knows: it is written until the application names it.
        expect(output).toContain("11564104");

        // The controller got the real body: the sanitizer works on a copy of what is logged.
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({username: "jane", password: "hunter2-is-the-password", pairingCode: "11564104"});

        // The framework did log the request, so the checks below mean something.
        expect(output).toContain("[INBOUND RESPONSE COMPLETED]");
        expect(output).toContain("the-mobile-app");
        expect(output).toContain("jane");
        expect(output).toContain("[REDACTED]");

        expect(output).not.toContain(JWT);
        expect(output).not.toContain("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9");
        expect(output).not.toContain("s3ss10n-c00k13");
        expect(output).not.toContain("k3y-0f-th3-cl13nt");
        expect(output).not.toContain("hunter2-is-the-password");
    });

    it("should also remove what the application names as a secret", async () => {
        const withKey = await send({"pristine.logging.sanitizer.additionalSensitiveKeys": "pairingCode"});
        expect(withKey.output).toContain("[INBOUND RESPONSE COMPLETED]");
        expect(withKey.output).not.toContain("11564104");
        expect(withKey.output).not.toContain("hunter2-is-the-password");
    });

    it("should write the value of a key that the application allows, and still hide the others", async () => {
        const {output} = await send({"pristine.logging.sanitizer.additionalAllowedKeys": "X-Api-Key"});

        expect(output).toContain("[INBOUND RESPONSE COMPLETED]");
        expect(output).toContain("k3y-0f-th3-cl13nt");
        expect(output).not.toContain("hunter2-is-the-password");
        expect(output).not.toContain(JWT);
        expect(output).not.toContain("s3ss10n-c00k13");
    });

    it("should write the secrets when the application turns the sanitizer off", async () => {
        const {output} = await send({"pristine.logging.sanitizer.isActive": false});

        // This is the leak the sanitizer closes. It proves that the two tests above pass because
        // of the sanitizer, and not because the request was never logged.
        expect(output).toContain(JWT);
        expect(output).toContain("hunter2-is-the-password");
    });
});
