import {ModuleInterface} from "@pristine-ts/common";
import {AwsApiGatewayModuleKeyname} from "./aws-api-gateway.module.keyname";
import {EnumResolver, EnvironmentVariableResolver} from "@pristine-ts/configuration";
import {ApiGatewayEventsHandlingStrategyEnum} from "./enums/api-gateway-events-handling-strategy.enum";
import {CoreModule} from "@pristine-ts/core";
import {NetworkingModule} from "@pristine-ts/networking";

export * from "./enums/enums";
export * from "./event-payloads/event-payloads";
export * from "./event-response-payloads/event-response-payloads";
export * from "./mappers/mappers";

export const AwsApiGatewayModule: ModuleInterface = {
  keyname: AwsApiGatewayModuleKeyname,
  configurationDefinitions: [
    /**
     * The handling strategy to handle rest api events from api gateway.
     */
    {
      parameterName: AwsApiGatewayModuleKeyname + ".restApiEvents.handlingStrategy",
      isRequired: false,
      defaultValue: ApiGatewayEventsHandlingStrategyEnum.Request,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_AWS_API_GATEWAY_REST_API_EVENTS_HANDLING_STRATEGY"), ApiGatewayEventsHandlingStrategyEnum),
      ],
    },

    /**
     * The handling strategy to handle http api events from api gateway.
     */
    {
      parameterName: AwsApiGatewayModuleKeyname + ".httpApiEvents.handlingStrategy",
      isRequired: false,
      defaultValue: ApiGatewayEventsHandlingStrategyEnum.Request,
      defaultResolvers: [
        new EnumResolver(new EnvironmentVariableResolver("PRISTINE_AWS_API_GATEWAY_HTTP_API_EVENTS_HANDLING_STRATEGY"), ApiGatewayEventsHandlingStrategyEnum),
      ],
    }
  ],
  importModules: [
    CoreModule,
    NetworkingModule,
  ],
}
