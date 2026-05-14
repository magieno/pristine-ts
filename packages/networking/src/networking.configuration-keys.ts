/**
 * Typed configuration keys for `@pristine-ts/networking`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {NetworkingConfigurationKeys} from "@pristine-ts/networking";
 *
 * constructor(@injectConfig(NetworkingConfigurationKeys.RequestBodyConverterIsActive) value: ...) {}
 * ```
 */
export const NetworkingConfigurationKeys = {
  RequestBodyConverterIsActive: "pristine.networking.requestBodyConverter.isActive",
  DefaultContentTypeResponseHeaderIsActive: "pristine.networking.defaultContentTypeResponseHeader.isActive",
  DefaultContentTypeResponseHeader: "pristine.networking.defaultContentTypeResponseHeader",
  RouterCacheIsActive: "pristine.networking.routerCache.isActive",
  ErrorResponseSanitizerIsActive: "pristine.networking.error_response_sanitizer.is_active",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/networking`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface NetworkingConfigurationValueMap {
  "pristine.networking.requestBodyConverter.isActive": boolean;
  "pristine.networking.defaultContentTypeResponseHeader.isActive": boolean;
  "pristine.networking.defaultContentTypeResponseHeader": string;
  "pristine.networking.routerCache.isActive": boolean;
  "pristine.networking.error_response_sanitizer.is_active": boolean;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends NetworkingConfigurationValueMap {}
}
