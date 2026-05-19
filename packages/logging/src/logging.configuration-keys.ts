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
  LogSuccessDepthConfiguration: "pristine.logging.logSuccessDepthConfiguration",
  LogNoticeDepthConfiguration: "pristine.logging.logNoticeDepthConfiguration",
  LogWarningDepthConfiguration: "pristine.logging.logWarningDepthConfiguration",
  LogErrorDepthConfiguration: "pristine.logging.logErrorDepthConfiguration",
  LogCriticalDepthConfiguration: "pristine.logging.logCriticalDepthConfiguration",
  ConsoleLoggerActivated: "pristine.logging.consoleLoggerActivated",
  ConsoleLoggerOutputMode: "pristine.logging.consoleLoggerOutputMode",
  ConsoleLoggerDebugStream: "pristine.logging.consoleLoggerDebugStream",
  ConsoleLoggerInfoStream: "pristine.logging.consoleLoggerInfoStream",
  ConsoleLoggerSuccessStream: "pristine.logging.consoleLoggerSuccessStream",
  ConsoleLoggerNoticeStream: "pristine.logging.consoleLoggerNoticeStream",
  ConsoleLoggerWarningStream: "pristine.logging.consoleLoggerWarningStream",
  ConsoleLoggerErrorStream: "pristine.logging.consoleLoggerErrorStream",
  ConsoleLoggerCriticalStream: "pristine.logging.consoleLoggerCriticalStream",
  FileLoggerOutputMode: "pristine.logging.fileLoggerOutputMode",
  FileLoggerActivated: "pristine.logging.fileLoggerActivated",
  FilePath: "pristine.logging.filePath",
  FileLoggerPretty: "pristine.logging.fileLoggerPretty",
  ActivateDiagnostics: "pristine.logging.activateDiagnostics",
  MaximumLogsPerSecond: "pristine.logging.maximumLogsPerSecond",
} as const;

import {OutputModeEnum} from "./enums/output-mode.enum";
import {SeverityEnum} from "./enums/severity.enum";
import {StreamEnum} from "./enums/stream.enum";

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/logging`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface LoggingConfigurationValueMap {
  "pristine.logging.numberOfStackedLogs": number;
  "pristine.logging.logSeverityLevelConfiguration": SeverityEnum;
  "pristine.logging.logDebugDepthConfiguration": number;
  "pristine.logging.logInfoDepthConfiguration": number;
  "pristine.logging.logSuccessDepthConfiguration": number;
  "pristine.logging.logNoticeDepthConfiguration": number;
  "pristine.logging.logWarningDepthConfiguration": number;
  "pristine.logging.logErrorDepthConfiguration": number;
  "pristine.logging.logCriticalDepthConfiguration": number;
  "pristine.logging.consoleLoggerActivated": boolean;
  "pristine.logging.consoleLoggerOutputMode": OutputModeEnum;
  "pristine.logging.consoleLoggerDebugStream": StreamEnum;
  "pristine.logging.consoleLoggerInfoStream": StreamEnum;
  "pristine.logging.consoleLoggerSuccessStream": StreamEnum;
  "pristine.logging.consoleLoggerNoticeStream": StreamEnum;
  "pristine.logging.consoleLoggerWarningStream": StreamEnum;
  "pristine.logging.consoleLoggerErrorStream": StreamEnum;
  "pristine.logging.consoleLoggerCriticalStream": StreamEnum;
  "pristine.logging.fileLoggerOutputMode": OutputModeEnum;
  "pristine.logging.fileLoggerActivated": boolean;
  "pristine.logging.filePath": string;
  "pristine.logging.fileLoggerPretty": boolean;
  "pristine.logging.activateDiagnostics": boolean;
  "pristine.logging.maximumLogsPerSecond": number;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends LoggingConfigurationValueMap {}
}
