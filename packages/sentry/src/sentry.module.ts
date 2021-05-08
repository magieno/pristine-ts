import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";
import {SentryModuleKeyname} from "./sentry.module.keyname";

export * from "./loggers/loggers";
export * from "./sentry.module.keyname";

export const SentryModule: ModuleInterface = {
    keyname: SentryModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: SentryModuleKeyname + ".sentryDsn",
            isRequired: true,
        },
        {
            parameterName: SentryModuleKeyname + ".tagRelease",
            isRequired: true,
        },
        {
            parameterName: SentryModuleKeyname + ".sentrySampleRate",
            isRequired: false,
            defaultValue: 0.1,
        },
        {
            parameterName: SentryModuleKeyname + ".sentryActivated",
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
