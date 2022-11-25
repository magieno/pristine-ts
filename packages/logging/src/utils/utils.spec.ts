import "reflect-metadata"
import {Utils} from "./utils";
import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";
import {OutputModeEnum} from "../enums/output-mode.enum";

describe("Utils", () => {

    it("should truncate if object deeper than max depth", async () => {

        const object = {
            hi: {
                hello: {
                    bye: "byebye",
                    date: new Date(1615830493000),
                    array: [
                        {
                            first: "first"
                        }
                    ]
                }
            }
        };

        expect(JSON.stringify(Utils.truncate(object, 1))).toEqual("{\"hi\":\"-- Truncated: Max Depth Reached --\"}");
        expect(JSON.stringify(Utils.truncate(object, 2))).toEqual("{\"hi\":{\"hello\":\"-- Truncated: Max Depth Reached --\"}}");
        expect(JSON.stringify(Utils.truncate(object, 3))).toEqual("{\"hi\":{\"hello\":{\"bye\":\"byebye\",\"date\":\"2021-03-15T17:48:13.000Z\",\"array\":\"-- Truncated: Max Depth Reached --\"}}}");
        expect(JSON.stringify(Utils.truncate(object, 4))).toEqual("{\"hi\":{\"hello\":{\"bye\":\"byebye\",\"date\":\"2021-03-15T17:48:13.000Z\",\"array\":[\"-- Truncated: Max Depth Reached --\"]}}}");
        expect(JSON.stringify(Utils.truncate(object, 5))).toEqual("{\"hi\":{\"hello\":{\"bye\":\"byebye\",\"date\":\"2021-03-15T17:48:13.000Z\",\"array\":[{\"first\":\"first\"}]}}}");
    });

    it("should properly output a log", async() => {
        const logInfo = new LogModel(SeverityEnum.Info, "Log info");
        logInfo.date = new Date("2021-01-01");
        logInfo.extra = {
            potato: "extra 1"
        };

        const logDebug = new LogModel(SeverityEnum.Debug, "Log debug");
        logDebug.date = new Date("2021-01-01");
        logDebug.extra = {
            potato: "extra 1"
        };

        const logWarning = new LogModel(SeverityEnum.Warning, "Log warning");
        logWarning.date = new Date("2021-01-01");
        logWarning.extra = {
            potato: "extra 1"
        };

        const logError = new LogModel(SeverityEnum.Error, "Log error");
        logError.date = new Date("2021-01-01");
        logError.extra = {
            potato: "extra 1"
        };

        const logCritical = new LogModel(SeverityEnum.Critical, "Log critical");
        logCritical.date = new Date("2021-01-01");
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

    it("should return the diagnostics", () => {
        const diagnostics = Utils.getDiagnostics({
            stack: "Error\n    at LogHandler.log (/Users/etiennenoel/Library/Application Support/JetBrains/IntelliJIdea2021.2/scratches/scratch_13.js:3:49)\n    at Main.run (/Users/etiennenoel/Library/Application Support/JetBrains/IntelliJIdea2021.2/scratches/scratch_13.js:11:25)\n    at Object.<anonymous> (/Users/etiennenoel/Library/Application Support/JetBrains/IntelliJIdea2021.2/scratches/scratch_13.js:17:6)\n    at Module._compile (internal/modules/cjs/loader.js:1063:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)\n    at Module.load (internal/modules/cjs/loader.js:928:32)\n    at Function.Module._load (internal/modules/cjs/loader.js:769:14)\n    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:72:12)\n    at internal/main/run_main_module.js:17:47",
            message: "",
            name: "",
        })

        expect(diagnostics.stackTrace.length).toBe(9);
        expect(diagnostics.stackTrace[0].className).toBe("LogHandler.log");
        expect(diagnostics.stackTrace[0].filename).toBe("/Users/etiennenoel/Library/Application Support/JetBrains/IntelliJIdea2021.2/scratches/scratch_13.js");
        expect(diagnostics.stackTrace[0].line).toBe("3");
        expect(diagnostics.stackTrace[0].column).toBe("49");
        expect(diagnostics.stackTrace[1].className).toBe("Main.run");
        expect(diagnostics.stackTrace[1].filename).toBe("/Users/etiennenoel/Library/Application Support/JetBrains/IntelliJIdea2021.2/scratches/scratch_13.js");
        expect(diagnostics.stackTrace[1].line).toBe("11");
        expect(diagnostics.stackTrace[1].column).toBe("25");
    })

});
