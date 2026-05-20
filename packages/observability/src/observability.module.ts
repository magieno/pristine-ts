import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {ObservabilityModuleKeyname} from "./observability.module.keyname";

export * from "./loggers/loggers";
export * from "./models/models";
export * from "./store/store";
export * from "./tracers/tracers";

export * from "./observability-configuration";
export * from "./observability.module.keyname";

/**
 * The observability module turns a running Pristine app's logs and traces into a
 * structured, queryable on-disk store under `.pristine/observability/`. The CLI's
 * `logs`, `trace` and `requests` commands read that store.
 *
 * It registers an `ObservabilityLogger` (a `Logger`-tagged transport) and an
 * `ObservabilityTracer` (a `Tracer`-tagged transport). Both stay dormant until a run is
 * begun via `ObservabilityRunManager.beginRun()` — so one-shot CLI commands never write
 * to the store; only `pristine start` runs do.
 *
 * Store settings are read from environment variables + defaults by
 * `ObservabilityConfiguration` (not the `@injectConfig` system) so the writers and query
 * commands remain constructible in any kernel — see that class for the rationale.
 */
export const ObservabilityModule: ModuleInterface = {
  keyname: ObservabilityModuleKeyname,
  importModules: [
    CommonModule,
    LoggingModule,
    TelemetryModule,
  ],
  providerRegistrations: [],
}
