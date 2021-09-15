import "reflect-metadata"
import {Utils} from "./utils";
import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";
import {OutputModeEnum} from "../enums/output-mode.enum";

describe("Utils", () => {

    it("should truncate if object deeper than max depth", async () => {

        const object = {
            bonjour: {
                allo: {
                    bye: "byebye",
                    date: new Date(1615830493000),
                }
            }
        };

        expect(Utils.truncate(object, 1)).toEqual({});
        expect(Utils.truncate(object, 2)).toEqual({bonjour:{}});
        expect(Utils.truncate(object, 3)).toEqual({bonjour:{allo:{bye:"byebye", date: new Date(1615830493000)}}});
        expect(Utils.truncate(object, 4)).toEqual({bonjour:{allo:{bye:"byebye", date: new Date(1615830493000)}}});
    });

    it("should properly output a log", async() => {
        const logInfo = new LogModel();
        logInfo.date = new Date("2021-01-01");
        logInfo.message = "Log info";
        logInfo.severity = SeverityEnum.Info;
        logInfo.extra = {
            potato: "extra 1"
        };

        const logDebug = new LogModel();
        logDebug.date = new Date("2021-01-01");
        logDebug.message = "Log debug";
        logDebug.severity = SeverityEnum.Debug;
        logDebug.extra = {
            potato: "extra 1"
        };

        const logWarning = new LogModel();
        logWarning.date = new Date("2021-01-01");
        logWarning.message = "Log warning";
        logWarning.severity = SeverityEnum.Warning;
        logWarning.extra = {
            potato: "extra 1"
        };

        const logError = new LogModel();
        logError.date = new Date("2021-01-01");
        logError.message = "Log error";
        logError.severity = SeverityEnum.Error;
        logError.extra = {
            potato: "extra 1"
        };

        const logCritical = new LogModel();
        logCritical.date = new Date("2021-01-01");
        logCritical.message = "Log critical";
        logCritical.severity = SeverityEnum.Critical;
        logCritical.extra = {
            potato: "extra 1",
        };

        expect(Utils.outputLog(logInfo, OutputModeEnum.Json, 10))
            .toEqual("{\"severity\":\"INFO\",\"message\":\"Log info\",\"date\":\"2021-01-01T00:00:00.000Z\",\"module\":\"application\",\"extra\":{\"potato\":\"extra 1\"}}")
        expect(Utils.outputLog(logDebug, OutputModeEnum.Json, 10))
            .toEqual("{\"severity\":\"DEBUG\",\"message\":\"Log debug\",\"date\":\"2021-01-01T00:00:00.000Z\",\"module\":\"application\",\"extra\":{\"potato\":\"extra 1\"}}")
        expect(Utils.outputLog(logWarning, OutputModeEnum.Json, 10))
            .toEqual("{\"severity\":\"WARNING\",\"message\":\"Log warning\",\"date\":\"2021-01-01T00:00:00.000Z\",\"module\":\"application\",\"extra\":{\"potato\":\"extra 1\"}}")
        expect(Utils.outputLog(logError, OutputModeEnum.Json, 10))
            .toEqual("{\"severity\":\"ERROR\",\"message\":\"Log error\",\"date\":\"2021-01-01T00:00:00.000Z\",\"module\":\"application\",\"extra\":{\"potato\":\"extra 1\"}}")
        expect(Utils.outputLog(logCritical, OutputModeEnum.Json, 10))
            .toEqual("{\"severity\":\"CRITICAL\",\"message\":\"Log critical\",\"date\":\"2021-01-01T00:00:00.000Z\",\"module\":\"application\",\"extra\":{\"potato\":\"extra 1\"}}")
    })

    it("should consider string as a flat type", async () => {

        const object = {
            bonjour: "allo",
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:"allo"});
    });

    it("should consider a number as a flat type", async () => {

        const object = {
            bonjour: 42,
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:42});
    });


    it("should consider a boolean as a flat type", async () => {

        const object = {
            bonjour: true,
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:true});
    });

    it("should consider a date as a flat type", async () => {

        const object = {
            bonjour: new Date(1615830493000),
        };

        expect(Utils.truncate(object, 1)).toEqual({bonjour:new Date(1615830493000)});
    });

});
