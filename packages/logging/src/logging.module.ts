import {ModuleInterface} from "@pristine-ts/common";
import {LogHandler} from "./handlers/log.handler";
import {ConsoleLogger} from "./loggers/console.logger";
import {FileLogger} from "./loggers/file.logger";
import {LoggingModuleKeyname} from "./logging.module.keyname";
import {
    BooleanResolver,
    ConfigurationModule,
    EnvironmentVariableResolver,
    NumberResolver
} from "@pristine-ts/configuration";

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
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_NUMBER_OF_STACKED_LOGS")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logSeverityLevelConfiguration",
            defaultValue: 0,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_SEVERITY_LEVEL_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logDebugDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_DEBUG_DEPTH_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logInfoDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_INFO_DEPTH_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logWarningDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_WARNING_DEPTH_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logErrorDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_ERROR_DEPTH_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logCriticalDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                await (new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_CRITICAL_DEPTH_CONFIGURATION")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerActivated",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                await (new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_ACTIVATED")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerActivated",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                await (new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_ACTIVATED")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".filePath",
            defaultValue: "./logs.txt",
            isRequired: false,
            defaultResolvers: [
                await (new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_PATH")).resolve()),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerPretty",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                await (new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_PRETTY")).resolve()),
            ]
        },
    ],
    importServices: [
        LogHandler,

        ConsoleLogger,
        FileLogger,
    ],
    importModules: [
        ConfigurationModule,
    ],
    providerRegistrations: []
}
