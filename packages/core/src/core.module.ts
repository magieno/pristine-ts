import {ModuleInterface} from "@pristine-ts/common";
import {CoreModuleKeyname} from "./core.module.keyname";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {ConfigurationModule, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {LoggingModule} from "@pristine-ts/logging";

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
      parameterName: CoreModuleKeyname + ".requestBodyConverterActive",
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_CORE_REQUEST_BODY_CONVERTER_ACTIVE")
      ]
    },
  ],
}
