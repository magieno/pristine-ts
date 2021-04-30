import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";

export * from "./loggers/loggers";

export const SentryModule: ModuleInterface = {
    keyname: "pristine.sentry",
    configurationDefinitions: [
        {
            parameterName: "pristine.sentry.sentryDsn",
            isRequired: true,
        },
        {
            parameterName: "pristine.sentry.tagRelease",
            isRequired: true,
        },
        {
            parameterName: "pristine.sentry.sentrySampleRate",
            isRequired: false,
            defaultValue: 0.1,
        },
        {
            parameterName: "pristine.sentry.sentryActivated",
            isRequired: false,
            defaultValue: false,
        },
    ],
    importServices: [],
    importModules: [],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.Logger,
            useToken: SentryLogger,
        }
    ]
}
