export interface ConfigurationDefinitionInterface {
    numberOfStackedLogs: number,
    logSeverityLevelConfiguration: number,
    logDebugDepthConfiguration?: number,
    logInfoDepthConfiguration?: number,
    logWarningDepthConfiguration?: number,
    logErrorDepthConfiguration?: number,
    logCriticalDepthConfiguration?: number,
    consoleLoggerActivated?: boolean,
    fileLoggerActivated?: boolean,
    filePath?: string,
    fileLoggerPretty?: boolean,

}
