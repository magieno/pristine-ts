/**
 * Typed configuration keys for `@pristine-ts/http`. Use these constants with `@injectConfig`
 * for autocomplete + rename safety, instead of typing the parameter name as a string.
 *
 * ```ts
 * import {injectConfig} from "@pristine-ts/common";
 * import {HttpConfigurationKeys} from "@pristine-ts/http";
 *
 * constructor(@injectConfig(HttpConfigurationKeys.LoggingEnabled) value: ...) {}
 * ```
 */
export const HttpConfigurationKeys = {
  LoggingEnabled: "pristine.http.logging-enabled",
  HttpServerFileAddress: "pristine.http.http-server.file.address",
  HttpServerFilePort: "pristine.http.http-server.file.port",
  KernelServerAddress: "pristine.http.kernel-server.address",
  KernelServerPort: "pristine.http.kernel-server.port",
  KernelServerTlsKeyPath: "pristine.http.kernel-server.tls.key-path",
  KernelServerTlsCertPath: "pristine.http.kernel-server.tls.cert-path",
} as const;

/**
 * The expected runtime types for each configuration value defined by `@pristine-ts/http`.
 * See `AwsConfigurationValueMap` in `@pristine-ts/aws` for the full pattern + caveats.
 */
export interface HttpConfigurationValueMap {
  "pristine.http.logging-enabled": boolean;
  "pristine.http.http-server.file.address": string;
  "pristine.http.http-server.file.port": number;
  "pristine.http.kernel-server.address": string;
  "pristine.http.kernel-server.port": number;
  "pristine.http.kernel-server.tls.key-path": string;
  "pristine.http.kernel-server.tls.cert-path": string;
}


/**
 * Augments the global `PristineConfigurationValueMap` (defined in `@pristine-ts/common`)
 * with this package's keys. The `@pristine-ts/eslint-plugin` rule
 * `inject-config-type-match` reads the merged map to enforce parameter types on
 * `@injectConfig` calls.
 */
declare module "@pristine-ts/common" {
  interface PristineConfigurationValueMap extends HttpConfigurationValueMap {}
}
