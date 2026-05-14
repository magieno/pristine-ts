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

import {ApiGatewayEventsHandlingStrategyEnum} from "./enums/api-gateway-events-handling-strategy.enum";

/**
 * The expected runtime types for each configuration value defined by
 * `@pristine-ts/aws-api-gateway`. See `AwsConfigurationValueMap` in `@pristine-ts/aws`
 * for the full pattern + caveats.
 */
export interface AwsApiGatewayConfigurationValueMap {
  "pristine.aws-api-gateway.restApiEvents.handlingStrategy": ApiGatewayEventsHandlingStrategyEnum;
  "pristine.aws-api-gateway.httpApiEvents.handlingStrategy": ApiGatewayEventsHandlingStrategyEnum;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends AwsApiGatewayConfigurationValueMap {}
}
