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
