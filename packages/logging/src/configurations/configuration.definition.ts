import {ConfigurationDefinitionInterface} from "../interfaces/configuration-definition.interface";

export class ConfigurationDefinition implements ConfigurationDefinitionInterface{
    numberOfStackedLogs: number = 10
    logSeverityLevelConfiguration: number = 0;
    logDebugDepthConfiguration?: number = 10;
    logInfoDepthConfiguration?: number = 10;
    logWarningDepthConfiguration?: number = 10;
    logErrorDepthConfiguration?: number = 10;
    logCriticalDepthConfiguration?: number = 10;
    consoleLoggerActivated?: boolean = false;
    fileLoggerActivated?: boolean = false;
    filePath?: string = "./logs.txt";
    fileLoggerPretty?: boolean = false;
}
