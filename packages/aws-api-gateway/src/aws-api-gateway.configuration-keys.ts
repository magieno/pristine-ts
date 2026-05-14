/**
 * Typed configuration keys for `@pristine-ts/aws-api-gateway`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {AwsApiGatewayConfigurationKeys} from "@pristine-ts/aws-api-gateway";
 *
 * constructor(@injectConfig(AwsApiGatewayConfigurationKeys.RestApiEventsHandlingStrategy) value: ...) {}
 * ```
 */
export const AwsApiGatewayConfigurationKeys = {
  RestApiEventsHandlingStrategy: "pristine.aws-api-gateway.restApiEvents.handlingStrategy",
  HttpApiEventsHandlingStrategy: "pristine.aws-api-gateway.httpApiEvents.handlingStrategy",
} as const;
