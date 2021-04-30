import "reflect-metadata"
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {FileLogger} from "./file.logger";
import fs from 'fs';


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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logInfo);
        expect(JSON.parse(logs[1])).toEqual(logDebug);
        expect(JSON.parse(logs[2])).toEqual(logWarning);
        expect(JSON.parse(logs[3])).toEqual(logError);
        expect(JSON.parse(logs[4])).toEqual(logCritical);

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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logDebug);
        expect(JSON.parse(logs[1])).toEqual(logWarning);
        expect(JSON.parse(logs[2])).toEqual(logError);
        expect(JSON.parse(logs[3])).toEqual(logCritical);
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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logWarning);
        expect(JSON.parse(logs[1])).toEqual(logError);
        expect(JSON.parse(logs[2])).toEqual(logCritical);
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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logError);
        expect(JSON.parse(logs[1])).toEqual(logCritical);
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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logCritical);
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
            false,
        );

        const logInfo = new LogModel();
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logInfo);

        const logDebug = new LogModel();
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logDebug);

        const logWarning = new LogModel();
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logWarning);

        const logError = new LogModel();
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logError);

        const logCritical = new LogModel();
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            extra: "extra 1"
        };
        fileWriter.readableStream.push(logCritical);

        await new Promise(res => setTimeout(res, 1000));

        const file = fs.readFileSync("./logs.txt", {encoding: "utf-8"});
        const logs = file.split(";\n");

        expect(JSON.parse(logs[0])).toEqual(logInfo);
        expect(JSON.parse(logs[1])).toEqual(logDebug);
        expect(JSON.parse(logs[2])).toEqual(logWarning);
        expect(JSON.parse(logs[3])).toEqual(logError);
        expect(JSON.parse(logs[4])).toEqual(logCritical);
    });

});
