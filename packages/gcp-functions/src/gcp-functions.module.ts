import {ModuleInterface} from "@pristine-ts/common";
import {CoreModule} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";
import {EnumResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {GcpFunctionsModuleKeyname} from "./gcp-functions.module.keyname";
import {GcpFunctionsEventsHandlingStrategyEnum} from "./enums/gcp-functions-events-handling-strategy.enum";

export * from "./enums/enums";
export * from "./event-payloads/event-payloads";
export * from "./event-response-payloads/event-response-payloads";
export * from "./mappers/mappers";

export * from "./gcp-functions.module.keyname";
export * from "./gcp-functions.configuration-keys";

export const GcpFunctionsModule: ModuleInterface = {
  keyname: GcpFunctionsModuleKeyname,
  configurationDefinitions: [
    {
      parameterName: GcpFunctionsModuleKeyname + ".cloudFunctionGen1.handlingStrategy",
      isRequired: false,
      defaultValue: GcpFunctionsEventsHandlingStrategyEnum.Request,
      defaultResolvers: [
        new EnumResolver(
          new EnvironmentVariableResolver("PRISTINE_GCP_FUNCTIONS_CLOUD_FUNCTION_GEN_1_HANDLING_STRATEGY"),
          GcpFunctionsEventsHandlingStrategyEnum,
        ),
      ],
    },
    {
      parameterName: GcpFunctionsModuleKeyname + ".cloudFunctionGen2.handlingStrategy",
      isRequired: false,
      defaultValue: GcpFunctionsEventsHandlingStrategyEnum.Event,
      defaultResolvers: [
        new EnumResolver(
          new EnvironmentVariableResolver("PRISTINE_GCP_FUNCTIONS_CLOUD_FUNCTION_GEN_2_HANDLING_STRATEGY"),
          GcpFunctionsEventsHandlingStrategyEnum,
        ),
      ],
    },
    {
      parameterName: GcpFunctionsModuleKeyname + ".cloudRun.handlingStrategy",
      isRequired: false,
      defaultValue: GcpFunctionsEventsHandlingStrategyEnum.Request,
      defaultResolvers: [
        new EnumResolver(
          new EnvironmentVariableResolver("PRISTINE_GCP_FUNCTIONS_CLOUD_RUN_HANDLING_STRATEGY"),
          GcpFunctionsEventsHandlingStrategyEnum,
        ),
      ],
    },
  ],
  importModules: [
    CoreModule,
    NetworkingModule,
  ],
};
