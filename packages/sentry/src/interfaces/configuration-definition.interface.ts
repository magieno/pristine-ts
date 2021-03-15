export interface ConfigurationDefinitionInterface {
    sentryDsn: string;
    tagRelease?: string;
    sentrySampleRate?: number;
    sentryActivated?: boolean;
}
