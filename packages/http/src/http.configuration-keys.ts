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
  /**
   * Largest request body, in bytes, `KernelHttpServer` buffers before answering
   * `413 Payload Too Large`. Default 100 MB.
   */
  KernelServerMaxBodySize: "pristine.http.kernel-server.max-body-size",

  /**
   * CORS keys consumed by `CorsRequestHandler` inside `KernelHttpServer`'s request path.
   * CORS is inactive unless `cors.allowed-origins` (and/or `cors.allowed-hosts`) is set —
   * a server with none of these configured behaves exactly as it did before CORS existed.
   * Each list key accepts a comma-separated string or a `string[]`.
   */
  CorsAllowedOrigins: "pristine.http.cors.allowed-origins",
  CorsAllowedMethods: "pristine.http.cors.allowed-methods",
  CorsAllowedHeaders: "pristine.http.cors.allowed-headers",
  CorsExposedHeaders: "pristine.http.cors.exposed-headers",
  CorsMaxAge: "pristine.http.cors.max-age",
  CorsAllowCredentials: "pristine.http.cors.allow-credentials",
  CorsAllowPrivateNetwork: "pristine.http.cors.allow-private-network",
  CorsAllowedHosts: "pristine.http.cors.allowed-hosts",
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
  "pristine.http.kernel-server.max-body-size": number;
  // List keys resolve to a comma-separated string from env/defaults; a consumer may also pass
  // a `string[]` programmatically via `kernel.start()` config. `CorsRequestHandler` normalizes
  // both forms, so the map documents the canonical (string) shape.
  "pristine.http.cors.allowed-origins": string;
  "pristine.http.cors.allowed-methods": string;
  "pristine.http.cors.allowed-headers": string;
  "pristine.http.cors.exposed-headers": string;
  "pristine.http.cors.max-age": number;
  "pristine.http.cors.allow-credentials": boolean;
  "pristine.http.cors.allow-private-network": boolean;
  "pristine.http.cors.allowed-hosts": string;
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
