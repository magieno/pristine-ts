import {injectable} from "tsyringe";
import {injectConfig} from "@pristine-ts/common";
import {PristineEnvironment} from "./pristine-environment.enum";

/**
 * Configuration key for the framework-wide runtime environment. Resolved value is one of
 * `PristineEnvironment`'s well-known values (`"prod"` / `"dev"`) or any custom string
 * (e.g. `"staging"`). Set via `pristine.config.ts` or the `PRISTINE_ENV` env var
 * (registered as a default resolver on `CoreModule`).
 */
export const PristineEnvironmentConfigurationKey = "pristine.environment";

/**
 * Exposes the runtime environment to the rest of the framework through a single
 * injectable surface.
 *
 * Consumers (`HttpErrorResponder`, `CliErrorReporter`, anyone else who needs to know what
 * environment the framework is running in) inject `EnvironmentManager` and call
 * `getEnvironment()`. The value flows through the normal config resolution chain —
 * defined in `CoreModule`, overridable via `pristine.config.ts` or the `PRISTINE_ENV`
 * env var.
 *
 * **Bootstrap escape hatch.** Code that runs before DI is ready (the CLI bin's outer
 * `.catch` handler, when kernel-boot itself fails) can `new EnvironmentManager(...)` with
 * the raw env value to get the same parsing logic without going through the container.
 */
@injectable()
export class EnvironmentManager {
  public constructor(
    @injectConfig(PristineEnvironmentConfigurationKey) private readonly rawEnvironment: string,
  ) {
  }

  /**
   * Returns the active environment as a lowercased string. Well-known values are exposed
   * via the `PristineEnvironment` enum (`"prod"`, `"dev"`); custom values (e.g.
   * `"staging"`) pass through verbatim so consumers can branch on them.
   *
   * Use enum-equality for the common dev/prod check:
   * `environmentManager.getEnvironment() === PristineEnvironment.Development`.
   */
  public getEnvironment(): string | PristineEnvironment {
    return (this.rawEnvironment ?? PristineEnvironment.Production).toLowerCase();
  }
}
