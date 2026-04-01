import {ModuleInterface} from "@pristine-ts/common";
import {CoreModuleKeyname} from "./core.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {ConfigurationModule, EnumResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";
import {EventIdGenerationStyleEnum} from "./enums/event-id-generation-style.enum";

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

export * from "./core.module.keyname";

export const CoreModule: ModuleInterface = {
  keyname: CoreModuleKeyname,
  importModules: [
    ConfigurationModule,
    TelemetryModule,
    LoggingModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [
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
