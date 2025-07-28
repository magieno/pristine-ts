import {ModuleInterface, ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {SentryLogger} from "./loggers/sentry.logger";
import {SentryModuleKeyname} from "./sentry.module.keyname";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";

export * from "./loggers/loggers";
export * from "./sentry.module.keyname";

export const SentryModule: ModuleInterface = {
  keyname: SentryModuleKeyname,
  configurationDefinitions: [
    /**
     * The Sentry dsn.
     */
    {
      parameterName: SentryModuleKeyname + ".sentryDsn",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_SENTRY_DSN"),
      ]
    },

    /**
     * The release to tag the captured logs with.
     */
    {
      parameterName: SentryModuleKeyname + ".tagRelease",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_SENTRY_TAG_RELEASE"),
      ]
    },

    /**
     * The sample rate at which logs should be captured. Only a certain percentage of the logs will be sent to Sentry to avoid sending to many logs.
     * Should be between 0 and 1. If no value or a value outside this range is provided, the default value of 0.1 will be used.
     */
    {
      parameterName: SentryModuleKeyname + ".sentrySampleRate",
      isRequired: false,
      defaultValue: 0.1,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_SENTRY_SAMPLE_RATE")),
      ]
    },

    /**
     * Whether or not logs should be captured and sent to Sentry.
     */
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
