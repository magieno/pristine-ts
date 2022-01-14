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
import {SeverityEnum} from "./enums/severity.enum";

export * from "./enums/enums";
export * from "./handlers/handlers";
export * from "./interfaces/interfaces";
export * from "./loggers/loggers";
export * from "./models/models";
export * from "./utils/utils";
export * from "./logging.module.keyname"

export const LoggingModule: ModuleInterface = {
    keyname: LoggingModuleKeyname,
    configurationDefinitions: [
        /**
         * The number of logs to keep in the stack and to print once a log with a high enough severity arrives.
         */
        {
            parameterName: LoggingModuleKeyname + ".numberOfStackedLogs",
            isRequired: false,
            defaultValue: 10,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_NUMBER_OF_STACKED_LOGS")),
            ]
        },
        /**
         * The number representing the severity from which logs should be outputted.
         * For example, if this is set to 3, any log that has a severity of Error(3) or critical(4) will be outputted.
         */
        {
            parameterName: LoggingModuleKeyname + ".logSeverityLevelConfiguration",
            defaultValue: SeverityEnum.Info,
            isRequired: false,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_SEVERITY_LEVEL_CONFIGURATION"), SeverityEnum),
            ]
        },
        /**
         * The number of level to go down in an object when printing a log with the Debug severity.
         * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
         */
        {
            parameterName: LoggingModuleKeyname + ".logDebugDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_DEBUG_DEPTH_CONFIGURATION")),
            ]
        },
        /**
         * The number of level to go down in an object when printing a log with the Info severity.
         * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
         */
        {
            parameterName: LoggingModuleKeyname + ".logInfoDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_INFO_DEPTH_CONFIGURATION")),
            ]
        },
        /**
         * The number of level to go down in an object when printing a log with the Warning severity.
         * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
         */
        {
            parameterName: LoggingModuleKeyname + ".logWarningDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_WARNING_DEPTH_CONFIGURATION")),
            ]
        },
        /**
         * The number of level to go down in an object when printing a log with the Error severity.
         * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
         */
        {
            parameterName: LoggingModuleKeyname + ".logErrorDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_ERROR_DEPTH_CONFIGURATION")),
            ]
        },
        /**
         * The number of level to go down in an object when printing a log with the Critical severity.
         * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
         */
        {
            parameterName: LoggingModuleKeyname + ".logCriticalDepthConfiguration",
            defaultValue: 5,
            isRequired: false,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_CRITICAL_DEPTH_CONFIGURATION")),
            ]
        },
        /**
         * Whether or not the console logger is activated and should output logs.
         */
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerActivated",
            defaultValue: true,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_ACTIVATED")),
            ]
        },
        /**
         * The output mode, that the console logger should use from the OutputModeEnum.
         */
        {
            parameterName: LoggingModuleKeyname + ".consoleLoggerOutputMode",
            defaultValue: OutputModeEnum.Json,
            isRequired: false,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_OUTPUT_MODE"), OutputModeEnum),
            ]
        },
        /**
         * The output mode, that the file logger should use from the OutputModeEnum.
         */
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerOutputMode",
            defaultValue: OutputModeEnum.Json,
            isRequired: false,
            defaultResolvers: [
                new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_OUTPUT_MODE"), OutputModeEnum),
            ]
        },
        /**
         * Whether or not the console logger is activated and should output logs.
         */
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerActivated",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_ACTIVATED")),
            ]
        },
        /**
         * The file path to which the file logger should output the logs.
         */
        {
            parameterName: LoggingModuleKeyname + ".filePath",
            defaultValue: "./logs.txt",
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_PATH")),
            ]
        },
        /**
         * Whether or not the file logger should prettify the outputted logs.
         */
        {
            parameterName: LoggingModuleKeyname + ".fileLoggerPretty",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_FILE_LOGGER_PRETTY")),
            ]
        },
        /**
         * Whether or not the diagnostic should be activated.
         * When activated, the stack trace and other diagnostic information will be added to the logs.
         * This is an intensive process and can dramatically reduce the performance of the code.
         */
        {
            parameterName: LoggingModuleKeyname + ".activateDiagnostics",
            defaultValue: false,
            isRequired: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_ACTIVATE_DIAGNOSTICS")),
            ]
        },
    ],
    importModules: [
        CommonModule,
        ConfigurationModule,
    ],
    providerRegistrations: []
};

