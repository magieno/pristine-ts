import {ModuleInterface} from "@pristine-ts/common";
import {LogHandler} from "./handlers/log.handler";
import {ConsoleLogger} from "./loggers/console.logger";
import {FileLogger} from "./loggers/file.logger";
import {LoggingModuleKeyname} from "./logging.module.keyname";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";

export * from "./enums/enums";
export * from "./handlers/handlers";
export * from "./interfaces/interfaces";
export * from "./models/models";
export * from "./loggers/loggers";
export * from "./utils/utils";
export * from "./logging.module.keyname"

export const LoggingModule: ModuleInterface = {
    keyname: LoggingModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: LoggingModuleKeyname + ".numberOfStackedLogs",
            isRequired: false,
            defaultValue: 10,
        },
        {
            parameterName: LoggingModuleKeyname + ".logSeverityLevelConfiguration",
            defaultValue: 0,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".logDebugDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".logInfoDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".logWarningDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".logErrorDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".logCriticalDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerActivated",
            defaultValue: false,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerActivated",
            defaultValue: false,
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".filePath",
            defaultValue: "./logs.txt",
            isRequired: false,
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerPretty",
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
