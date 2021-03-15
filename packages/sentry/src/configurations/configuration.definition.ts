import {ConfigurationDefinitionInterface} from "../interfaces/configuration-definition.interface";

export class ConfigurationDefinition implements ConfigurationDefinitionInterface{
    sentryDsn: string;
    tagRelease?: string;
    sentrySampleRate?: number = 0.1;
    sentryActivated?: boolean = false;
}
