import {LogModel} from "../models/log.model";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {SeverityEnum} from "../enums/severity.enum";
import format from "date-fns/format";
import {DiagnosticsModel} from "../models/diagnostics.model";
import {last} from "lodash";

export class Utils {

    static flatTypes = [String, Number, Boolean, Date]

    public static isDefined(val) {
        return val !== null && val !== undefined;
    }

    public static isFlat(val) {
        return !this.isDefined(val) || ~this.flatTypes.indexOf(val.constructor)
    }

    public static getDeepKeys(obj): string[] {
        let subkeys: string[];
        let keys: string[] = [];
        for (var key in obj) {
            if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
                subkeys = Utils.getDeepKeys(obj[key]);
                keys = keys.concat(subkeys);
            } else if (Array.isArray(obj[key])) {
                for (var i = 0; i < obj[key].length; i++) {
                    subkeys = Utils.getDeepKeys(obj[key][i]);
                    keys = keys.concat(subkeys);
                }
            }

            keys.push(key);
        }

        return keys;
    }


    public static truncate(object: any, maxDepth: number, curDepth = 0) {
        if (curDepth < maxDepth) {
            const newDepth = curDepth + 1;

            if (this.isFlat(object)) {
                return object;
            } else if (Array.isArray(object)) {
                const newArr: any[] = [];
                object.map(value => {
                    if (this.isFlat(value)) {
                        newArr.push(value);
                    } else {
                        newArr.push(this.truncate(value, maxDepth, newDepth));
                    }
                })
                return newArr;
            } else {
                const newObj = {}
                for (const key in object) {
                    if (this.isFlat(object[key])) {
                        newObj[key] = object[key];
                    } else {
                        newObj[key] = this.truncate(object[key], maxDepth, newDepth);
                    }
                }
                return newObj;
            }
        }

        return;
    }

    public static getSeverityText(logSeverity: SeverityEnum): string {
        switch (logSeverity) {
            case SeverityEnum.Debug:
                return "DEBUG";

            case SeverityEnum.Info:
                return "INFO";

            case SeverityEnum.Warning:
                return "WARNING";

            case SeverityEnum.Error:
                return "ERROR";

            case SeverityEnum.Critical:
                return "CRITICAL";
        }
    }

    public static outputLog(log: LogModel, outputMode: OutputModeEnum, logDepth: number, spaceNumber = 0): string {
        const jsonSortOrders = ["severity", "message", "date", "module", "traceId", "kernelInstantiationId",];

        switch (outputMode) {
            case OutputModeEnum.Json:
                const truncatedLog: any = Utils.truncate(log, logDepth);
                truncatedLog.severity = Utils.getSeverityText(truncatedLog.severity);

                const truncatedLogKeys = Utils.getDeepKeys(truncatedLog);
                jsonSortOrders.forEach(jsonSortOrder => {
                    delete truncatedLogKeys[jsonSortOrder];
                })

                jsonSortOrders.push(...truncatedLogKeys);

                return JSON.stringify(truncatedLog, jsonSortOrders, spaceNumber);
            case OutputModeEnum.Simple:
                return format(log.date, "yyyy-MM-dd HH:mm:ss") + " - " + " [" + this.getSeverityText(log.severity) + "] - " + log.message + " - " + JSON.stringify(Utils.truncate(log.extra, 2));
        }
    }

    public static getDiagnostics(error: Error): DiagnosticsModel {
        const diagnostics: DiagnosticsModel = new DiagnosticsModel();

        const errorStack = error.stack;

        const regex = new RegExp("at (?:(.+?)\\s+\\()?(?:(.+?):(\\d+)(?::(\\d+))?|([^)]+))\\)?", "g");

        if (errorStack === undefined) {
            return diagnostics;
        }

        let match = regex.exec(errorStack);

        let i = 0;
        while (match !== null) {
            const stackTrace = {
                className : match[1],
                filename : match[2],
                line : match[3],
                column : match[4],
            };

            if(i === 0) {
                diagnostics.lastStackTrace = stackTrace;
            }

            diagnostics.stackTrace.push(stackTrace);

            match = regex.exec(errorStack);
            i++;
        }

        if(diagnostics.lastStackTrace === undefined && diagnostics.stackTrace.length > 0) {
            diagnostics.lastStackTrace = diagnostics.stackTrace[0];
        }

        return diagnostics;
    }
}
