import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {CoreModuleKeyname} from "./core.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {ConfigurationModule, EnumResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";
import {EventIdGenerationStyleEnum} from "./enums/event-id-generation-style.enum";
import {PristineEnvironment} from "./managers/pristine-environment.enum";
import {PristineEnvironmentConfigurationKey} from "./managers/environment.manager";

export * from "./kernel";

export * from "./dispatchers/dispatchers";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./handlers/handlers";
export * from "./interceptors/interceptors";
export * from "./interfaces/interfaces";
export * from "./listeners/listeners";
export * from "./managers/managers";
export * from "./mappers/mappers";
export * from "./models/models";
export * from "./pipelines/pipelines";
export * from "./runtime-servers/runtime-servers";

export * from "./core.module.keyname";

export const CoreModule: ModuleInterface = {
  keyname: CoreModuleKeyname,
  importModules: [
    CommonModule,
    ConfigurationModule,
    TelemetryModule,
    LoggingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [
    /**
     * Framework-wide runtime environment. Drives how `HttpErrorResponder` and
     * `CliErrorReporter` render thrown errors:
     *   - `prod` (default): sanitized output. Stack traces omitted, system-error
     *     messages replaced with a generic line.
     *   - `dev`: verbose output with stack + cause chain.
     *   - Custom values (e.g. `staging`) pass through to `EnvironmentManager.getEnvironment()`
     *     for consumers that branch on their own environment names.
     *
     * Override via `pristine.config.ts` or the `PRISTINE_ENV` env var.
     */
    {
      parameterName: PristineEnvironmentConfigurationKey,
      defaultValue: PristineEnvironment.Production,
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_ENV"),
      ],
    },
    {
      parameterName: CoreModuleKeyname + ".event_id_generation_style",
      defaultValue: EventIdGenerationStyleEnum.Uuid,
      isRequired: false,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_CORE_EVENT_ID_GENERATION_STYLE"), EventIdGenerationStyleEnum)
      ]
    },
    {
      parameterName: CoreModuleKeyname + ".requestBodyConverterActive",
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_CORE_REQUEST_BODY_CONVERTER_ACTIVE")
      ]
    },
  ],
}
