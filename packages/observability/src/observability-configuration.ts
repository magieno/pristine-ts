import {injectable} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {ObservabilityModuleKeyname} from "./observability.module.keyname";
import {ObservabilityConfigurationKeys} from "./observability.configuration-keys";

/**
 * Resolved settings for the observability store. Populated through the framework
 * configuration system (`@injectConfig`) — the keys are declared by
 * `ObservabilityModule.configurationDefinitions`, each with an `EnvironmentVariableResolver`
 * so they can also be overridden by env var or `pristine.config.ts`.
 *
 * The writers and the query commands all depend on this single typed object rather than
 * injecting individual config keys, so there is exactly one place that knows the keys.
 */
@injectable()
@moduleScoped(ObservabilityModuleKeyname)
export class ObservabilityConfiguration {
  constructor(
    /** Master switch for the observability writers. */
    @injectConfig(ObservabilityConfigurationKeys.Enabled) public readonly enabled: boolean,
    /** Root directory of the store, resolved relative to `process.cwd()` when not absolute. */
    @injectConfig(ObservabilityConfigurationKeys.Directory) public readonly directory: string,
    /** How many of the most recent runs to keep; older runs are pruned when a new run begins. */
    @injectConfig(ObservabilityConfigurationKeys.RetainedRuns) public readonly retainedRuns: number,
    /** When true, the store begins a run on the first log/trace instead of waiting for `beginRun()`. */
    @injectConfig(ObservabilityConfigurationKeys.AutoBegin) public readonly autoBegin: boolean,
    /** Per-run disk budget in bytes; the store drops oldest data past it. `0` disables the cap. */
    @injectConfig(ObservabilityConfigurationKeys.MaxRunSizeBytes) public readonly maxRunSizeBytes: number,
  ) {
  }
}
