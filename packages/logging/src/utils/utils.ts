import {LogModel} from "../models/log.model";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {SeverityEnum} from "../enums/severity.enum";
import format from "date-fns/format";
import {DiagnosticsModel} from "../models/diagnostics.model";
import {last} from "lodash";

/**
 * This class provides some utility functions to help with the logging.
 */
export class Utils {

    static flatTypes = [String, Number, Boolean, Date]

    /**
     * Returns whether or not the value is defined
     * @param val
     */
    public static isDefined(val: any) {
        return val !== null && val !== undefined;
    }

    /**
     * Returns whether or not the value is flat, meaning it is not an object.
     * @param val
     */
    public static isFlat(val: any) {
        return !this.isDefined(val) || ~this.flatTypes.indexOf(val.constructor)
    }

    /**
     * Gets the deep keys of an object.
     * @param obj The object.
     */
    public static getDeepKeys(obj: any): string[] {
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

    /**
     * This function truncates an object to the max depth required.
     * @param object The object to truncate.
     * @param maxDepth The max depth of the object.
     * @param curDepth The current depth at which we are at.
     */
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
                const newObj: any = {}
                for (const key in object) {
                    try {
                        if (this.isFlat(object[key])) {
                            newObj[key] = object[key];
                        } else {
                            newObj[key] = this.truncate(object[key], maxDepth, newDepth);
                        }
                    }catch (e) {

                    }

                }
                return newObj;
            }
        }

        return;
    }

    /**
     * Gets the string representing a value of the log severity enum.
     * @param logSeverity The log severity for which to get the string representation.
     */
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

    /**
     * Returns the string formatted log based on the output model.
     * @param log The log to be string formatted.
     * @param outputMode The output mode desired.
     * @param logDepth The log depth.
     * @param spaceNumber The number of spaces for a tab.
     */
    public static outputLog(log: LogModel, outputMode: OutputModeEnum, logDepth: number, spaceNumber = 0): string {
        const jsonSortOrders: string[] = ["severity", "message", "date", "module", "traceId", "kernelInstantiationId"];

        switch (outputMode) {
            case OutputModeEnum.Json:
                const truncatedLog: any = Utils.truncate(log, logDepth);
                truncatedLog.severity = Utils.getSeverityText(truncatedLog.severity);

                const truncatedLogKeys: string[] = Utils.getDeepKeys(truncatedLog).filter( (truncatedLogKey: string) => jsonSortOrders.find(element => element === truncatedLogKey) === undefined)

                jsonSortOrders.push(...truncatedLogKeys);

                return JSON.stringify(truncatedLog, jsonSortOrders, spaceNumber);
            case OutputModeEnum.Simple:
                return format(log.date, "yyyy-MM-dd HH:mm:ss") + " - " + " [" + this.getSeverityText(log.severity) + "] - " + log.message + " - " + JSON.stringify(Utils.truncate(log.extra, 2));
        }
    }

    /**
     * Creates the diagnostic model from an error object to attach to a log.
     * @param error The error object from which to get the stack trace.
     */
    public static getDiagnostics(error: Error): DiagnosticsModel {
        const diagnostics: DiagnosticsModel = new DiagnosticsModel();

        const errorStack = error.stack;

        const regex = new RegExp("at (?:(.+?)\\s+\\()?(?:(.+?):(\\d+)(?::(\\d+))?|([^)]+))\\)?", "g");

        if (errorStack === undefined) {
            return diagnostics;
        }

        let match = regex.exec(errorStack);

        while (match !== null) {
            const stackTrace = {
                className : match[1],
                filename : match[2],
                line : match[3],
                column : match[4],
            };

            diagnostics.stackTrace.push(stackTrace);

            match = regex.exec(errorStack);
        }

        if(diagnostics.lastStackTrace === undefined && diagnostics.stackTrace.length > 0) {
            diagnostics.lastStackTrace = diagnostics.stackTrace[0];
        }

        return diagnostics;
    }
}
