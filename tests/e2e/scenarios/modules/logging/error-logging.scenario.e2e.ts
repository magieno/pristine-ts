import {CoreModule, Kernel} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";
import {LoggingModule, LogHandler, LogHandlerInterface, SeverityEnum} from "@pristine-ts/logging";
// @ts-ignore
global.console = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}

describe("Error logging", () => {
    it("should properly log the error to the console", async () => {
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

        const spy = jest.spyOn(global.console, "error");

        const loggedMessage = spy.mock.calls[0][0];

        expect(loggedMessage).toBeDefined();

        const parsedLoggedMessage = JSON.parse(loggedMessage);

        expect(parsedLoggedMessage.severity).toBe("ERROR");
        expect(parsedLoggedMessage.message).toBe("This is an error message.")

        expect(parsedLoggedMessage.extra).toBeDefined();
        expect(parsedLoggedMessage.extra.error).toBeDefined();
        expect(parsedLoggedMessage.extra.error.message).toBe("Error thrown somewhere")
        expect(parsedLoggedMessage.extra.error.stack).toBeDefined()

        logHandler.terminate();

        await new Promise(res => setTimeout(res, 100));
    })
})
