/**
 * Typed configuration keys for `@pristine-ts/logging`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {LoggingConfigurationKeys} from "@pristine-ts/logging";
 *
 * constructor(@injectConfig(LoggingConfigurationKeys.NumberOfStackedLogs) value: ...) {}
 * ```
 */
export const LoggingConfigurationKeys = {
  NumberOfStackedLogs: "pristine.logging.numberOfStackedLogs",
  LogSeverityLevelConfiguration: "pristine.logging.logSeverityLevelConfiguration",
  LogDebugDepthConfiguration: "pristine.logging.logDebugDepthConfiguration",
  LogInfoDepthConfiguration: "pristine.logging.logInfoDepthConfiguration",
  LogNoticeDepthConfiguration: "pristine.logging.logNoticeDepthConfiguration",
  LogWarningDepthConfiguration: "pristine.logging.logWarningDepthConfiguration",
  LogErrorDepthConfiguration: "pristine.logging.logErrorDepthConfiguration",
  LogCriticalDepthConfiguration: "pristine.logging.logCriticalDepthConfiguration",
  ConsoleLoggerActivated: "pristine.logging.consoleLoggerActivated",
  ConsoleLoggerOutputMode: "pristine.logging.consoleLoggerOutputMode",
  FileLoggerOutputMode: "pristine.logging.fileLoggerOutputMode",
  FileLoggerActivated: "pristine.logging.fileLoggerActivated",
  FilePath: "pristine.logging.filePath",
  FileLoggerPretty: "pristine.logging.fileLoggerPretty",
  ActivateDiagnostics: "pristine.logging.activateDiagnostics",
  MaximumLogsPerSecond: "pristine.logging.maximumLogsPerSecond",
} as const;
