export interface ConfigurationDefinitionInterface {
    numberOfStackedLogs: number,
    logSeverityLevelConfiguration: number,
    logDebugDepthConfiguration?: number,
    logInfoDepthConfiguration?: number,
    logWarningDepthConfiguration?: number,
    logErrorDepthConfiguration?: number,
    logCriticalDepthConfiguration?: number,
    consoleWriterActivated?: boolean,
    fileWriterActivated?: boolean,
    filePath?: string,

}
