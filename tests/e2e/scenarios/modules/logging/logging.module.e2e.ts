import "reflect-metadata"
import {container} from "tsyringe";
import {Kernel} from "@pristine-ts/core";
import {controller, NetworkingModule, route} from "@pristine-ts/networking";
import {CoreModule} from "@pristine-ts/core";
import {LoggingModule, LogHandler} from "@pristine-ts/logging";


// @ts-ignore
global.console = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}

describe("Logging Module instantiation in the Kernel", () => {

    beforeEach(async () => {
        // Very import to clear the instances in between executions.
        container.clearInstances();
    })

    it("should log properly", async () => {

        const kernel = new Kernel();
        await kernel.start({
            keyname: "logging.test",
            importModules: [CoreModule, NetworkingModule, LoggingModule],
            providerRegistrations: [],
            importServices: [],
        }, {
            "pristine.logging.numberOfStackedLogs": 10,
            "pristine.logging.logSeverityLevelConfiguration": 0,
            "pristine.logging.logDebugDepthConfiguration": 10,
            "pristine.logging.logInfoDepthConfiguration": 10,
            "pristine.logging.logWarningDepthConfiguration": 10,
            "pristine.logging.logErrorDepthConfiguration": 10,
            "pristine.logging.logCriticalDepthConfiguration": 10,
            "pristine.logging.consoleLoggerActivated": true,
            "pristine.logging.fileLoggerActivated": false,
            "pristine.logging.fileLoggerPretty":false,
        });

        const logHandler: LogHandler = await kernel.container.resolve(LogHandler);

        logHandler.info("Allo", {depth1:{depth2:{depth3: {depth4: {depth5: {depth6: {depth7: {depth8: {depth9: 10}}}}}}}}});

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).toHaveBeenCalled();

        logHandler.terminate();

        await new Promise(res => setTimeout(res, 1000));
    })
})
