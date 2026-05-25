import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModule} from "@pristine-ts/logging";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {ObservabilityModuleKeyname} from "./observability.module.keyname";
import {ObservabilityConfigurationKeys} from "./observability.configuration-keys";

export * from "./interfaces/interfaces";
export * from "./loggers/loggers";
export * from "./models/models";
export * from "./paths/paths";
export * from "./serializers/serializers";
export * from "./store/store";
export * from "./tailers/tailers";
export * from "./tracers/tracers";

export * from "./observability.configuration-keys";
export * from "./observability.module.keyname";

/**
 * The observability module turns a running Pristine app's logs and traces into a
 * structured, queryable on-disk store under `.pristine/observability/`. The CLI's
 * `logs`, `trace` and `requests` commands read that store.
 *
 * It registers an `ObservabilityLogger` (a `Logger`-tagged transport) and an
 * `ObservabilityTracer` (a `Tracer`-tagged transport). Both are thin adapters that
 * forward to `LogStore` / `TraceStore`, which own all file I/O. Each pristine process
 * writes to its own instance directory (keyed by the kernel instantiation id), so
 * concurrent processes never race; the first append from a process lazy-creates its
 * directory. There is no `beginRun` / `endRun` ceremony — capture is always on whenever
 * `enabled` is true.
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
     * forward to the stores' `append`, which is a no-op.
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
     * How many of the most recent instance directories to keep. Older instance
     * directories are pruned (whole `rm -rf`) the first time a new pristine process
     * appends to the store.
     */
    {
      parameterName: ObservabilityConfigurationKeys.RetainedInstances,
      defaultValue: 10,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_RETAINED_INSTANCES")),
      ]
    },
  ]
}
