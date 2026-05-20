import {injectable} from "tsyringe";

/**
 * Settings for the observability store.
 *
 * Deliberately resolved from environment variables + defaults rather than the framework's
 * `@injectConfig` system. The observability writers and the query commands are reachable
 * from `@injectAll(Command)` / `@injectAll(Logger)` in *any* kernel that transitively
 * imports `@pristine-ts/cli` (e.g. through `@pristine-ts/http`). If these classes injected
 * module-registered config tokens, constructing them in a kernel that doesn't load
 * `ObservabilityModule` would throw on an unregistered token. A zero-dependency
 * configuration object keeps them constructible everywhere; the store simply stays
 * dormant when no run is begun.
 *
 * Overridable via:
 *   - `PRISTINE_OBSERVABILITY_ENABLED`            (`"false"` to disable; default enabled)
 *   - `PRISTINE_OBSERVABILITY_DIRECTORY`          (default `.pristine/observability`)
 *   - `PRISTINE_OBSERVABILITY_RETAINED_RUNS`      (default `10`)
 *   - `PRISTINE_OBSERVABILITY_AUTO_BEGIN`         (`"true"` to auto-start a run; default off)
 *   - `PRISTINE_OBSERVABILITY_MAX_RUN_SIZE_BYTES` (per-run disk cap; default 100 MB; `0` = uncapped)
 */
@injectable()
export class ObservabilityConfiguration {
  /**
   * Master switch for the observability writers.
   */
  public readonly enabled: boolean;

  /**
   * Root directory of the observability store, resolved relative to `process.cwd()` when
   * not absolute.
   */
  public readonly directory: string;

  /**
   * How many of the most recent runs to keep; older runs are pruned when a new run begins.
   */
  public readonly retainedRuns: number;

  /**
   * When true, the store begins a run automatically on the first log/trace, instead of
   * waiting for an explicit `beginRun()`.
   *
   * Off by default — under the `pristine` CLI, `StartCommand` calls `beginRun()`
   * explicitly, and one-shot commands must NOT create runs. But a server started outside
   * the CLI (a hand-bootstrapped HTTP/gRPC server, `node dist/main.js`, etc.) has nothing
   * calling `beginRun()`. Such a server sets `PRISTINE_OBSERVABILITY_AUTO_BEGIN=true` and
   * gets the store turnkey, with no code change. (Lambda and other ephemeral runtimes
   * should leave this off — there's no durable disk worth writing to.)
   */
  public readonly autoBegin: boolean;

  /**
   * Disk budget for a single run, in bytes. When a run's total on-disk size
   * (`logs.jsonl` + `requests.jsonl` + `traces/`) exceeds this, the store drops its
   * oldest data — oldest trace files first, then the head of `logs.jsonl` — keeping the
   * newest. Combined with `retainedRuns`, the whole store is bounded by
   * `retainedRuns × maxRunSizeBytes`. `0` disables the cap. Default: 100 MB.
   */
  public readonly maxRunSizeBytes: number;

  constructor() {
    this.enabled = process.env.PRISTINE_OBSERVABILITY_ENABLED !== "false";
    this.directory = process.env.PRISTINE_OBSERVABILITY_DIRECTORY ?? ".pristine/observability";
    this.autoBegin = process.env.PRISTINE_OBSERVABILITY_AUTO_BEGIN === "true";

    const retained = Number(process.env.PRISTINE_OBSERVABILITY_RETAINED_RUNS);
    this.retainedRuns = Number.isFinite(retained) && retained > 0 ? retained : 10;

    const maxRunSize = Number(process.env.PRISTINE_OBSERVABILITY_MAX_RUN_SIZE_BYTES);
    this.maxRunSizeBytes = Number.isFinite(maxRunSize) && maxRunSize >= 0 ? maxRunSize : 100 * 1024 * 1024;
  }
}
