import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";
import {SentryModuleKeyname} from "./sentry.module.keyname";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";

export * from "./loggers/loggers";
export * from "./sentry.module.keyname";

export const SentryModule: ModuleInterface = {
    keyname: SentryModuleKeyname,
    configurationDefinitions: [
        {
            parameterName: SentryModuleKeyname + ".sentryDsn",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_SENTRY_DSN"),
            ]
        },
        {
            parameterName: SentryModuleKeyname + ".tagRelease",
            isRequired: true,
            defaultResolvers: [
                new EnvironmentVariableResolver("PRISTINE_SENTRY_TAG_RELEASE"),
            ]
        },
        {
            parameterName: SentryModuleKeyname + ".sentrySampleRate",
            isRequired: false,
            defaultValue: 0.1,
            defaultResolvers: [
                new NumberResolver(new EnvironmentVariableResolver("PRISTINE_SENTRY_SAMPLE_RATE")),
            ]
        },
        {
            parameterName: SentryModuleKeyname + ".sentryActivated",
            isRequired: false,
            defaultValue: false,
            defaultResolvers: [
                new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_SENTRY_ACTIVATED")),
            ]
        },
    ],
    importModules: [],
    providerRegistrations: [
        {
            token: ServiceDefinitionTagEnum.Logger,
            useToken: SentryLogger,
        }
    ]
}
