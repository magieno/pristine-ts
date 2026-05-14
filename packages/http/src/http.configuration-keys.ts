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
