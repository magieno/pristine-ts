import {ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {CoreModule} from "@pristine-ts/core";
import {EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {GcpModuleKeyname} from "./gcp.module.keyname";

export * from "./clients/clients";
export * from "./enums/enums";
export * from "./errors/errors";
export * from "./event-payloads/event-payloads";
export * from "./interfaces/interfaces";
export * from "./mappers/mappers";
export * from "./models/models";

export * from "./gcp.module.keyname";

export * from "./gcp.configuration-keys";
export const GcpModule: ModuleInterface = {
  keyname: GcpModuleKeyname,
  configurationDefinitions: [
    /**
     * The GCP project id. Required for every GCP client; corresponds to the standard
     * `GOOGLE_CLOUD_PROJECT` environment variable.
     */
    {
      parameterName: GcpModuleKeyname + ".projectId",
      isRequired: true,
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_CLOUD_PROJECT"),
        new EnvironmentVariableResolver("GCP_PROJECT"),
      ],
    },
    /**
     * The default GCP region.
     */
    {
      parameterName: GcpModuleKeyname + ".region",
      isRequired: false,
      defaultValue: "us-central1",
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_CLOUD_REGION"),
      ],
    },
    /**
     * Optional path to a service-account key file. When unset, the GCP SDKs use
     * Application Default Credentials (ADC).
     */
    {
      parameterName: GcpModuleKeyname + ".credentials",
      isRequired: false,
      defaultValue: "",
      defaultResolvers: [
        new EnvironmentVariableResolver("GOOGLE_APPLICATION_CREDENTIALS"),
      ],
    },
  ],
  importModules: [
    LoggingModule,
    CoreModule,
  ],
  providerRegistrations: [],
};
