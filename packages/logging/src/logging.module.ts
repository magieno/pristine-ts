import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModuleKeyname} from "./logging.module.keyname";
import {
    BooleanResolver,
    ConfigurationModule, EnumResolver,
    EnvironmentVariableResolver,
    NumberResolver
} from "@pristine-ts/configuration";
import {OutputModeEnum} from "./enums/output-mode.enum";
import {CommonModule} from "@pristine-ts/common";

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
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_NUMBER_OF_STACKED_LOGS")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logSeverityLevelConfiguration",
            defaultValue: 0,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_SEVERITY_LEVEL_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logDebugDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_DEBUG_DEPTH_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logInfoDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_INFO_DEPTH_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logWarningDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_WARNING_DEPTH_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logErrorDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_ERROR_DEPTH_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".logCriticalDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_CRITICAL_DEPTH_CONFIGURATION")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerActivated",
            defaultValue: true,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_ACTIVATED")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerOutputMode",
            defaultValue: OutputModeEnum.Json,
            isRequired: false,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_OUTPUT_MODE"), OutputModeEnum),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerOutputMode",
            defaultValue: OutputModeEnum.Json,
            isRequired: false,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_OUTPUT_MODE"), OutputModeEnum),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerActivated",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_ACTIVATED")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".filePath",
            defaultValue: "./logs.txt",
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_PATH")),
            ]
        },
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerPretty",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_PRETTY")),
            ]
        },
    ],
    importModules: [
        CommonModule,
        ConfigurationModule,
    ],
    providerRegistrations: []
}
