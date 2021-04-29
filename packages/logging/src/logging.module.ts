import {ModuleInterface} from "@pristine-ts/common";
import {LogHandler} from "./handlers/log.handler";
import {ConsoleLogger} from "./loggers/console.logger";
import {FileLogger} from "./loggers/file.logger";

export * from "./enums/enums";
export * from "./handlers/handlers";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./loggers/loggers";
export * from "./utils/utils";

export const LoggingModule: ModuleInterface = {
    keyname: "pristine.logging",
    configurationDefinitions: [
        {
            parameterName: "pristine.logging.numberOfStackedLogs",
            isRequired: false,
            defaultValue: 10,
        },
        {
            parameterName: "pristine.logging.numberOfStackedLogs",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logSeverityLevelConfiguration",
            defaultValue: 0,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logDebugDepthConfiguration",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logInfoDepthConfiguration",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logWarningDepthConfiguration",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logErrorDepthConfiguration",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.logCriticalDepthConfiguration",
            defaultValue: 10,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.consoleLoggerActivated",
            defaultValue: false,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.fileLoggerActivated",
            defaultValue: false,
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.filePath",
            defaultValue: "./logs.txt",
            isRequired: false,
        },
        {
            parameterName: "pristine.logging.fileLoggerPretty",
            defaultValue: false,
            isRequired: false,
        },
    ],
    importServices: [
        LogHandler,

        ConsoleLogger,
        FileLogger,
    ],
    importModules: [],
    providerRegistrations: []
}
