import {ConfigurationDefinitionInterface} from "../interfaces/configuration-definition.interface";

export class ConfigurationDefinition implements ConfigurationDefinitionInterface{
    numberOfStackedLogs: number = 10
    logSeverityLevelConfiguration: number = 0;
    logDebugDepthConfiguration?: number = 10;
    logInfoDepthConfiguration?: number = 10;
    logWarningDepthConfiguration?: number = 10;
    logErrorDepthConfiguration?: number = 10;
    logCriticalDepthConfiguration?: number = 10;
    consoleWriterActivated?: boolean = false;
}
