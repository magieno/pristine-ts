import "reflect-metadata"
import {ConsoleLogger} from "./console.writer";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {FileLogger} from "./file.writer";
const fs = require('fs');


describe("File writer", () => {
    afterEach(async () => {
        // Very import to clear the instances in between executions.
        fs.unlinkSync('./logs.txt');
    })

    it("should log if configuration level is info and severity is higher", async () => {
        const fileWriter = new FileLogger(
            0,
            SeverityEnum.Info,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log info - Extra: { extra: 'extra 1' }");
        expect(lines[1]).toEqual("Log debug - Extra: { extra: 'extra 1' }");
        expect(lines[2]).toEqual("Log warning - Extra: { extra: 'extra 1' }");
        expect(lines[3]).toEqual("Log error - Extra: { extra: 'extra 1' }");
        expect(lines[4]).toEqual("Log critical - Extra: { extra: 'extra 1' }");

    });

    it("should log if configuration level is debug and severity is higher", async () => {
        const fileWriter = new FileLogger(
            0,
            SeverityEnum.Debug,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log debug - Extra: { extra: 'extra 1' }");
        expect(lines[1]).toEqual("Log warning - Extra: { extra: 'extra 1' }");
        expect(lines[2]).toEqual("Log error - Extra: { extra: 'extra 1' }");
        expect(lines[3]).toEqual("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log if configuration level is warning and severity is higher", async () => {
        const fileWriter = new FileLogger(
            0,
            SeverityEnum.Warning,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log warning - Extra: { extra: 'extra 1' }");
        expect(lines[1]).toEqual("Log error - Extra: { extra: 'extra 1' }");
        expect(lines[2]).toEqual("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log if configuration level is error and severity is higher", async () => {
        const fileWriter = new FileLogger(
            0,
            SeverityEnum.Error,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log error - Extra: { extra: 'extra 1' }");
        expect(lines[1]).toEqual("Log critical - Extra: { extra: 'extra 1' }");
    });


    it("should log if configuration level is critical and severity is higher", async () => {
        const fileWriter = new FileLogger(
            0,
            SeverityEnum.Critical,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log critical - Extra: { extra: 'extra 1' }");
    });

    it("should log stacked logs if log something", async () => {
        const fileWriter = new FileLogger(
            5,
            SeverityEnum.Critical,
            3,
            3,
            3,
            3,
            3,
            true,
            "./logs.txt",
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        logInfo.identity = "1234567890"
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        logDebug.identity = "1234567890"
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        logWarning.identity = "1234567890"
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        logError.identity = "1234567890"
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        logCritical.identity = "1234567890"
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const lines = file.split("\n");

        expect(lines[0]).toEqual("Log info - Extra: { extra: 'extra 1' }");
        expect(lines[1]).toEqual("Log debug - Extra: { extra: 'extra 1' }");
        expect(lines[2]).toEqual("Log warning - Extra: { extra: 'extra 1' }");
        expect(lines[3]).toEqual("Log error - Extra: { extra: 'extra 1' }");
        expect(lines[4]).toEqual("Log critical - Extra: { extra: 'extra 1' }");
    });

});
