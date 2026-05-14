import {inject} from "tsyringe";

/**
 * Parameter decorator that injects a resolved configuration value by its parameter name.
 *
 * The configuration manager registers every resolved value in the DI container under
 * the token `"%" + key + "%"`. This decorator wraps `tsyringe`'s `@inject(...)` with
 * that token-format convention so consumers can write the configuration key directly:
 *
 * ```ts
 * // Before — stringly-typed, leaks the token format:
 * constructor(@inject("%pristine.http.kernel-server.port%") private readonly port: number) {}
 *
 * // After:
 * constructor(@injectConfig("pristine.http.kernel-server.port") private readonly port: number) {}
 * ```
 *
 * The two forms are functionally identical — the underlying lookup is the same — but
 * the decorator name documents intent and the call site no longer carries the `%...%`
 * sigils. Existing `@inject("%...%")` usages keep working.
 *
 * @param configurationKey The configuration parameter name (e.g. `"pristine.http.kernel-server.port"`).
 *   This is the same string you use in a `ConfigurationDefinition.parameterName`.
 */
export const injectConfig = (configurationKey: string) =>
  inject(`%${configurationKey}%`);
