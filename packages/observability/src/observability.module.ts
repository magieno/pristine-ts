import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {ObservabilityModuleKeyname} from "./observability.module.keyname";
import {ObservabilityConfigurationKeys} from "./observability.configuration-keys";

export * from "./loggers/loggers";
export * from "./models/models";
export * from "./store/store";
export * from "./tracers/tracers";

export * from "./observability.configuration-keys";
export * from "./observability.module.keyname";

/**
 * The observability module turns a running Pristine app's logs and traces into a
 * structured, queryable on-disk store under `.pristine/observability/`. The CLI's
 * `logs`, `trace` and `requests` commands read that store.
 *
 * It registers an `ObservabilityLogger` (a `Logger`-tagged transport) and an
 * `ObservabilityTracer` (a `Tracer`-tagged transport). Both stay dormant until a run is
 * begun via `ObservabilityRunManager.beginRun()` (or, when `autoBegin` is set, on the
 * first write) — so one-shot CLI commands never write to the store.
 *
 * `CliModule` imports this module, so the CLI always has it; a non-CLI app that wants the
 * store imports `ObservabilityModule` directly.
 */
export const ObservabilityModule: ModuleInterface = {
  keyname: ObservabilityModuleKeyname,
  importModules: [
    CommonModule,
    LoggingModule,
    TelemetryModule,
  ],
  providerRegistrations: [],
  configurationDefinitions: [
    /**
     * Master switch for the observability writers. When false, the logger and tracer
     * never write, regardless of whether a run is active.
     */
    {
      parameterName: ObservabilityConfigurationKeys.Enabled,
      defaultValue: true,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_ENABLED")),
      ]
    },
    /**
     * Root directory of the observability store. Resolved relative to `process.cwd()`
     * when not absolute.
     */
    {
      parameterName: ObservabilityConfigurationKeys.Directory,
      defaultValue: ".pristine/observability",
      isRequired: false,
      defaultResolvers: [
        new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_DIRECTORY"),
      ]
    },
    /**
     * How many of the most recent runs to keep. Older run directories are pruned when a
     * new run begins.
     */
    {
      parameterName: ObservabilityConfigurationKeys.RetainedRuns,
      defaultValue: 10,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_RETAINED_RUNS")),
      ]
    },
    /**
     * When true, the store begins a run automatically on the first log/trace, instead of
     * waiting for an explicit `beginRun()`. Off by default — under the CLI, `StartCommand`
     * calls `beginRun()` and one-shot commands must not create runs. A server started
     * outside the CLI sets this to capture its logs/traces with no code.
     */
    {
      parameterName: ObservabilityConfigurationKeys.AutoBegin,
      defaultValue: false,
      isRequired: false,
      defaultResolvers: [
        new BooleanResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_AUTO_BEGIN")),
      ]
    },
    /**
     * Disk budget for a single run, in bytes. When a run's total on-disk size exceeds
     * this, the store drops its oldest data, keeping the newest. Combined with
     * `retainedRuns`, the whole store is bounded by `retainedRuns × maxRunSizeBytes`.
     * `0` disables the cap. Default: 100 MB.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxRunSizeBytes,
      defaultValue: 100 * 1024 * 1024,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_RUN_SIZE_BYTES")),
      ]
    },
  ]
}
