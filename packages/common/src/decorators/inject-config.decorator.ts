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
 * ## Optional value-type hint
 *
 * Pass an explicit type argument to document the expected value type at the call site.
 * The expected type is also published in each package's `<Pkg>ConfigurationValueMap`
 * interface, which `getConfigValueType<K>` can read for a typed lookup helper:
 *
 * ```ts
 * import {Algorithm} from "jsonwebtoken";
 * import {JwtConfigurationKeys} from "@pristine-ts/jwt";
 *
 * constructor(
 *   @injectConfig<Algorithm>(JwtConfigurationKeys.Algorithm) private readonly algorithm: Algorithm,
 * ) {}
 * ```
 *
 * **Important caveat**: TypeScript's parameter-decorator API does **not** allow the
 * decorator to constrain the static type of the parameter it decorates. The `<T>`
 * generic is a hint for human readers; if you write `@injectConfig<Algorithm>(...) x:
 * number`, the compiler will not flag the mismatch. A separate ESLint rule (planned)
 * will perform that check at lint time.
 *
 * @typeParam T The expected runtime type of the resolved value. Defaults to `unknown`
 *   so the call site can omit the generic when documentation is not desired.
 * @param configurationKey The configuration parameter name (e.g. `"pristine.http.kernel-server.port"`).
 *   This is the same string you use in a `ConfigurationDefinition.parameterName`.
 */
export const injectConfig = <T = unknown>(configurationKey: string) =>
  inject(`%${configurationKey}%`);
