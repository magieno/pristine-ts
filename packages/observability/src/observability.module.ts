import {CommonModule, ModuleInterface} from "@pristine-ts/common";
import {LoggingModule, SeverityEnum} from "@pristine-ts/logging";
import {TelemetryModule} from "@pristine-ts/telemetry";
import {BooleanResolver, EnvironmentVariableResolver, NumberResolver} from "@pristine-ts/configuration";
import {ObservabilityModuleKeyname} from "./observability.module.keyname";
import {ObservabilityConfigurationKeys} from "./observability.configuration-keys";

export * from "./interfaces/interfaces";
export * from "./loggers/loggers";
export * from "./models/models";
export * from "./options/options";
export * from "./paths/paths";
export * from "./serializers/serializers";
export * from "./store/store";
export * from "./tailers/tailers";
export * from "./tracers/tracers";
export * from "./utils/utils";

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
 * **Disk usage is bounded, by default to 100 MB** (`maxStoreSize`). Four independent
 * limits keep it there, because instance-directory retention alone bounds nothing for a
 * long-running process — a server writes to a single instance directory for its whole
 * lifetime:
 *
 * | Limit | Key | Default |
 * | --- | --- | --- |
 * | Whole store | `maxStoreSize` | 100 MB |
 * | One `.jsonl` file, ×`maxLogFiles` generations | `maxLogFileSize` | 10 MB × 3 |
 * | Trace files per instance | `maxTraceFiles` / `maxTraceFileSize` | 500 × 1 MB |
 * | One log entry | `maxEntrySize` | 64 KB |
 *
 * Plus `logSeverityLevelConfiguration` (default `Info`), which keeps debug traffic off
 * disk entirely, and `maxRetentionAgeInMilliseconds` (default 7 days).
 *
 * To turn capture off completely: `PRISTINE_OBSERVABILITY_ENABLED=false`.
 *
 * `CliModule` imports this module, so the CLI always has it; `HttpModule` imports it too,
 * so any HTTP app captures by default. A non-CLI, non-HTTP app that wants the store
 * imports `ObservabilityModule` directly.
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
     * directories are pruned (whole `rm -rf`) when a sweep runs, unless a running
     * process still owns them (checked through the directory's `pid` sidecar).
     */
    {
      parameterName: ObservabilityConfigurationKeys.RetainedInstances,
      defaultValue: 10,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_RETAINED_INSTANCES")),
      ]
    },
    /**
     * **The hard ceiling on everything the store occupies, in bytes** — 100 MB by
     * default. Enforced across every partition: when the store exceeds it, abandoned
     * instance directories go first, then individual rotated log generations and trace
     * files (oldest first) from the partitions that survive. A live process's *current*
     * `logs.jsonl` / `requests.jsonl` is never deleted out from under it.
     *
     * Set to `0` to disable the byte ceiling and rely on count/age retention alone.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxStoreSize,
      defaultValue: 100 * 1024 * 1024,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_STORE_SIZE")),
      ]
    },
    /**
     * Byte ceiling for a single live `.jsonl` file (`logs.jsonl`, `requests.jsonl`).
     * Crossing it rolls the file over to `<name>.1.jsonl`. This is what bounds a
     * long-running process, whose partition is never a candidate for instance-level
     * pruning while it runs.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxLogFileSize,
      defaultValue: 10 * 1024 * 1024,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_LOG_FILE_SIZE")),
      ]
    },
    /**
     * How many generations of each `.jsonl` file to keep, the live one included. `3`
     * means `logs.jsonl` + `logs.1.jsonl` + `logs.2.jsonl`. Readers concatenate them in
     * write order, so raising this only lengthens the history `pristine logs` can show.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxLogFiles,
      defaultValue: 3,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_LOG_FILES")),
      ]
    },
    /**
     * How many `traces/<eventId>.json` files one partition keeps. Traces are one file
     * per request, so this is the guard against exhausting directory entries and inodes
     * on a busy server — rotation on the `.jsonl` files does not bound it.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxTraceFiles,
      defaultValue: 500,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_TRACE_FILES")),
      ]
    },
    /**
     * Byte ceiling for a single rendered trace tree. A trace above it is not written;
     * its `RequestSummary` is still appended, flagged with `traceOmitted`, so the request
     * remains listed by `pristine requests`. Set to `0` to write traces of any size.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxTraceFileSize,
      defaultValue: 1024 * 1024,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_TRACE_FILE_SIZE")),
      ]
    },
    /**
     * Byte ceiling for a single log entry. An entry above it is rewritten without its
     * `extra` payload (flagged `extraOmitted`) — `extra` is the unbounded part, and
     * dropping it keeps every correlation field intact. Set to `0` to disable.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxEntrySize,
      defaultValue: 64 * 1024,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_ENTRY_SIZE")),
      ]
    },
    /**
     * How long an instance directory may sit untouched before a sweep removes it, in
     * milliseconds (7 days by default). Live partitions are exempt. Set to `0` to keep
     * data regardless of age and rely on the count and byte limits.
     */
    {
      parameterName: ObservabilityConfigurationKeys.MaxRetentionAgeInMilliseconds,
      defaultValue: 7 * 24 * 60 * 60 * 1000,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_MAX_RETENTION_AGE_IN_MILLISECONDS")),
      ]
    },
    /**
     * Minimum `SeverityEnum` captured to disk (`Info` by default). The store deliberately
     * bypasses `BaseLogger`, so without this every `debug()` call in the app was written
     * at full fidelity even when the console threshold hid it. Set to `SeverityEnum.Debug`
     * (`0`) to capture everything.
     */
    {
      parameterName: ObservabilityConfigurationKeys.LogSeverityLevelConfiguration,
      defaultValue: SeverityEnum.Info,
      isRequired: false,
      defaultResolvers: [
        new NumberResolver(new EnvironmentVariableResolver("PRISTINE_OBSERVABILITY_LOG_SEVERITY_LEVEL_CONFIGURATION")),
      ]
    },
  ]
}
