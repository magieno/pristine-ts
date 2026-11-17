import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModuleKeyname} from "./logging.module.keyname";
import {
  BooleanResolver,
  ConfigurationModule,
  EnumResolver,
  EnvironmentVariableResolver,
  NumberResolver,
  StringListResolver
} from "@pristine-ts/configuration";
import {LogSanitizerDefaults} from "./sanitizers/log-sanitizer.defaults";
import {OutputModeEnum} from "./enums/output-mode.enum";
import {SeverityEnum} from "./enums/severity.enum";
import {StreamEnum} from "./enums/stream.enum";

export * from "./enums/enums";
export * from "./interfaces/interfaces";
export * from "./loggers/loggers";
export * from "./models/models";
export * from "./logging.module.keyname";
export * from "./handlers/handlers";
export * from "./types/types";
export * from "./utils/utils";
export * from "./sanitizers/sanitizers";


export * from "./logging.configuration-keys";
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
     * The number of level to go down in an object when printing a log with the Success severity.
     * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
     */
    {
      parameterName: LoggingModuleKeyname + ".logSuccessDepthConfiguration",
      defaultValue: 5,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_SUCCESS_DEPTH_CONFIGURATION")),
      ]
    },
    /**
     * The number of level to go down in an object when printing a log with the Notice severity.
     * We often do not need to go to the bottom layer of an object, so we can truncate at a certain depth.
     */
    {
      parameterName: LoggingModuleKeyname + ".logNoticeDepthConfiguration",
      defaultValue: 5,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_LOG_NOTICE_DEPTH_CONFIGURATION")),
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
     * Which standard stream (stdout vs stderr) the console logger writes Debug-severity
     * logs to. Defaults follow common CLI conventions: informational severities go to
     * stdout, problem severities go to stderr.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerDebugStream",
      defaultValue: StreamEnum.Stdout,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_DEBUG_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Info-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerInfoStream",
      defaultValue: StreamEnum.Stdout,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_INFO_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Success-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerSuccessStream",
      defaultValue: StreamEnum.Stdout,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_SUCCESS_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Notice-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerNoticeStream",
      defaultValue: StreamEnum.Stdout,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_NOTICE_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Warning-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerWarningStream",
      defaultValue: StreamEnum.Stderr,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_WARNING_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Error-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerErrorStream",
      defaultValue: StreamEnum.Stderr,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_ERROR_STREAM"), StreamEnum),
      ]
    },
    /**
     * Which standard stream the console logger writes Critical-severity logs to.
     */
    {
      parameterName: LoggingModuleKeyname + ".consoleLoggerCriticalStream",
      defaultValue: StreamEnum.Stderr,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_CONSOLE_LOGGER_CRITICAL_STREAM"), StreamEnum),
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
    /**
     * Whether or not the diagnostic should be activated.
     * When activated, the stack trace and other diagnostic information will be added to the logs.
     * This is an intensive process and can dramatically reduce the performance of the code.
     */
    {
      parameterName: LoggingModuleKeyname + ".maximumLogsPerSecond",
      defaultValue: 50,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_MAXIMUM_LOGS_PER_SECOND")),
      ]
    },
    /**
     * Whether the logs are sanitized: the secrets are replaced before any logger gets the log.
     * It is on by default. The framework logs the headers and the body of every request, so with
     * this off an `Authorization` header or a password reaches every logger.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.isActive",
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_IS_ACTIVE")),
      ]
    },
    /**
     * The list keys of the sanitizer are lists of strings. In an environment variable, a list is a
     * comma-separated string or a JSON array of strings (`StringListResolver`); use the JSON array
     * when an entry has a comma, as a regular expression often has.
     *
     * The keys whose value is replaced whole. A key matches without its case and without the
     * characters that are not letters or digits, when it is one of these or ends with one of
     * these. Setting this REPLACES the defaults; to add to them, use `additionalSensitiveKeys`.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.sensitiveKeys",
      defaultValue: LogSanitizerDefaults.sensitiveKeys,
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_SENSITIVE_KEYS")),
      ]
    },
    /**
     * Keys added to `sensitiveKeys`. This is where an application names its own secrets, for
     * example `pairingCode`, and keeps the defaults.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.additionalSensitiveKeys",
      defaultValue: [],
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_ADDITIONAL_SENSITIVE_KEYS")),
      ]
    },
    /**
     * The allow-list: the keys that are never treated as a secret, though they match a sensitive
     * key. An allowed key must match exactly (without its case and punctuation); it does not cover
     * the keys that end with it. A value under an allowed key still goes through the value
     * patterns: a JWT is a JWT under any key. Setting this REPLACES the defaults; to add to them,
     * use `additionalAllowedKeys`.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.allowedKeys",
      defaultValue: LogSanitizerDefaults.allowedKeys,
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_ALLOWED_KEYS")),
      ]
    },
    /**
     * Keys added to `allowedKeys`. This is where an application says that one of its keys is not
     * a secret, for example `nextPageToken` or `tokenType`.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.additionalAllowedKeys",
      defaultValue: [],
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_ADDITIONAL_ALLOWED_KEYS")),
      ]
    },
    /**
     * The sources of the regular expressions whose matches are replaced inside every string, the
     * message included. Setting this REPLACES the defaults; to add to them, use
     * `additionalSensitiveValuePatterns`. In an environment variable, use a JSON array: a regular
     * expression often contains a comma.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.sensitiveValuePatterns",
      defaultValue: LogSanitizerDefaults.sensitiveValuePatterns,
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_SENSITIVE_VALUE_PATTERNS")),
      ]
    },
    /**
     * Patterns added to `sensitiveValuePatterns`. This is where an application names the shape of
     * its own tokens, for example `sk_live_[A-Za-z0-9]+`.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.additionalSensitiveValuePatterns",
      defaultValue: [],
      isRequired: false,
      defaultResolvers: [
        new StringListResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_ADDITIONAL_SENSITIVE_VALUE_PATTERNS")),
      ]
    },
    /**
     * What replaces a secret in a log.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.replacement",
      defaultValue: LogSanitizerDefaults.replacement,
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_REPLACEMENT"),
      ]
    },
    /**
     * How deep the sanitizer goes into an object. What is deeper is replaced, not kept, so a
     * secret cannot get out because it was deep. Keep it at or above the deepest
     * `log*DepthConfiguration`, or the loggers print the replacement where they printed data.
     */
    {
      parameterName: LoggingModuleKeyname + ".sanitizer.maximumDepth",
      defaultValue: LogSanitizerDefaults.maximumDepth,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_LOGGING_SANITIZER_MAXIMUM_DEPTH")),
      ]
    },
  ],
  importModules: [
    CommonModule,
    ConfigurationModule,
  ],
  providerRegistrations: []
};

