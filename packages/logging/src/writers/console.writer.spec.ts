import "reflect-metadata"
import {ConsoleWriter} from "./console.writer";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";


describe("Console writer", () => {

    beforeEach(async () => {
        // @ts-ignore
        global.console = {
            info: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            error: jest.fn()
        }

    })

    it("should log if configuration level is info and severity is higher", async () => {
        const consoleWriter = new ConsoleWriter(
            0,
            SeverityEnum.Info,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log if configuration level is debug and severity is higher", async () => {
        const consoleWriter = new ConsoleWriter(
            0,
            SeverityEnum.Debug,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).not.toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log if configuration level is warning and severity is higher", async () => {
        const consoleWriter = new ConsoleWriter(
            0,
            SeverityEnum.Warning,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).not.toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).not.toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log if configuration level is error and severity is higher", async () => {
        const consoleWriter = new ConsoleWriter(
            0,
            SeverityEnum.Error,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).not.toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).not.toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).not.toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });


    it("should log if configuration level is critical and severity is higher", async () => {
        const consoleWriter = new ConsoleWriter(
            0,
            SeverityEnum.Critical,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).not.toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).not.toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).not.toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).not.toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log stacked logs if log something", async () => {
        const consoleWriter = new ConsoleWriter(
            5,
            SeverityEnum.Critical,
            3,
            3,
            3,
            3,
            3,
            true,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        consoleWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        consoleWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        consoleWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        consoleWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        consoleWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        expect(global.console.info).toHaveBeenCalledWith("Log info - Extra: { extra: 'extra 1' }");
        expect(global.console.debug).toHaveBeenCalledWith("Log debug - Extra: { extra: 'extra 1' }");
        expect(global.console.warn).toHaveBeenCalledWith("Log warning - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log error - Extra: { extra: 'extra 1' }");
        expect(global.console.error).toHaveBeenCalledWith("Log critical - Extra: { extra: 'extra 1' }");
    });

});
