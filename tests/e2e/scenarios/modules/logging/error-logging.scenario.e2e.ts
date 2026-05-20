import "reflect-metadata";
import {CoreModule, Kernel} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";
import {LoggingModule, LogHandler, LogHandlerInterface} from "@pristine-ts/logging";

describe("Error logging", () => {
    it("should properly log the error to the console", async () => {
        // ConsoleLogger writes directly to process.stderr for error-severity logs (per the
        // default ConsoleLogger<Sev>Stream config). Spy on stderr rather than console.error.
        const stderrSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);

        const kernel = new Kernel();
        await kernel.start({
            keyname: "logging.test",
            importModules: [CoreModule, NetworkingModule, LoggingModule],
            providerRegistrations: [],
            importServices: [],
        }, {
            "pristine.logging.consoleLoggerActivated": true,
            "pristine.logging.fileLoggerActivated": false,
        });

        const logHandler: LogHandlerInterface = await kernel.container.resolve(LogHandler);

        const error = new Error("Error thrown somewhere");

        logHandler.error("This is an error message.", {
            extra: {
                error,
            }
        })

        await new Promise(res => setTimeout(res, 100));

        // Boot may emit other logs to stderr; pick the call carrying our message.
        const loggedCall = stderrSpy.mock.calls.find(
            (call) => typeof call[0] === "string" && (call[0] as string).includes("This is an error message."),
        );
        expect(loggedCall).toBeDefined();

        const loggedMessage = loggedCall![0] as string;
        const parsedLoggedMessage = JSON.parse(loggedMessage);

        expect(parsedLoggedMessage.severity).toBe("ERROR");
        expect(parsedLoggedMessage.message).toBe("This is an error message.")

        expect(parsedLoggedMessage.extra).toBeDefined();
        expect(parsedLoggedMessage.extra.error).toBeDefined();
        expect(parsedLoggedMessage.extra.error.message).toBe("Error thrown somewhere")
        expect(parsedLoggedMessage.extra.error.stack).toBeDefined()

        logHandler.terminate();
        stderrSpy.mockRestore();

        await new Promise(res => setTimeout(res, 100));
    })
})
