import * as fs from "fs";
import {inject, injectable, singleton} from "tsyringe";
import {injectConfig, InternalContainerParameterEnum, moduleScoped, Trace} from "@pristine-ts/common";
import {traceRenderer} from "@pristine-ts/telemetry";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {RequestSummary} from "../models/request-summary.model";
import {ObservabilityPaths} from "../paths/observability-paths";
import {SerializedTrace} from "../interfaces/serialized-trace.interface";
import {TraceDeserializer} from "../serializers/trace-deserializer";

/**
 * The read/write layer for captured traces. The `ObservabilityTracer` (a `Tracer`-tagged
 * transport) calls `append` on every completed trace; the CLI's `trace` and `requests`
 * commands call `find` / `recentRequests` / `recentTraceIds`. The REPL also reads
 * `recentTraceIds` for its tab-completion.
 *
 * Writes both `traces/<traceId>.json` (the full tree) and an appended one-line summary in
 * `requests.jsonl` (the fast index for `pristine requests`) as a single coupled operation.
 * Each pristine process writes to its own instance directory (keyed by the kernel
 * instantiation id) so two processes never race on the same files. No begin/end ceremony:
 * the directory is lazy-created on first append. Retention is by whole-instance count.
 *
 * Singleton so multiple appenders within the same process share the in-memory `pruned`
 * latch.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class TraceStore {
  private readonly paths: ObservabilityPaths;
  private directoryEnsured = false;
  private pruned = false;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Enabled) private readonly enabled: boolean,
    @injectConfig(ObservabilityConfigurationKeys.Directory) directory: string,
    @injectConfig(ObservabilityConfigurationKeys.RetainedInstances) private readonly retainedInstances: number,
    @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly instanceId: string,
  ) {
    this.paths = new ObservabilityPaths(directory);
  }

  /**
   * Persists a completed trace: writes `traces/<traceId>.json` (the full tree) and appends
   * a one-line summary to `requests.jsonl`. No-op when observability is disabled.
   *
   * HTTP metadata (`http.method`, `http.path`, `http.statusCode`) is read from the trace's
   * `context` — populated upstream by the networking HTTP-to-trace enrichment. Non-HTTP
   * traces simply have those fields undefined in the summary.
   */
  append(trace: Trace): void {
    if (this.enabled === false) {
      return;
    }
    this.ensureInstanceDirectory();
    const traceContent = traceRenderer.renderJson(trace);
    const requestLine = JSON.stringify(this.buildSummary(trace)) + "\n";
    fs.writeFileSync(this.paths.traceFile(this.instanceId, trace.id), traceContent);
    fs.appendFileSync(this.paths.requestsFile(this.instanceId), requestLine);
  }

  /**
   * Finds and rehydrates a trace by id, returning a `Trace` instance with its full span
   * tree rebuilt (instance methods like `getDuration()` work directly). Searches the
   * preferred instance first when given, then every other instance most-recent first.
   */
  find(traceId: string, preferredInstanceId?: string): {trace: Trace; instanceId: string} | undefined {
    const serialized = this.findSerialized(traceId, preferredInstanceId);
    if (serialized === undefined) {
      return undefined;
    }
    return {trace: TraceDeserializer.deserialize(serialized.trace), instanceId: serialized.instanceId};
  }

  /**
   * Same as `find`, but returns the raw stored JSON. The escape hatch for callers that
   * want to render the on-disk shape verbatim — e.g. `pristine trace --format json`.
   */
  findSerialized(traceId: string, preferredInstanceId?: string): {trace: SerializedTrace; instanceId: string} | undefined {
    const ordered = this.searchOrder(preferredInstanceId);
    for (const instanceId of ordered) {
      try {
        const trace = JSON.parse(fs.readFileSync(this.paths.traceFile(instanceId, traceId), "utf8")) as SerializedTrace;
        return {trace, instanceId};
      } catch {
        // Not in this instance — keep looking.
      }
    }
    return undefined;
  }

  /**
   * The request summaries for an instance, most-recent first, optionally capped to
   * `limit`. Defaults to the most recent instance.
   */
  recentRequests(instanceId?: string, limit?: number): RequestSummary[] {
    const id = instanceId ?? this.latestInstanceId();
    if (id === undefined) {
      return [];
    }
    const summaries = this.readJsonl<RequestSummary>(this.paths.requestsFile(id))
      .sort((a, b) => b.startedAt - a.startedAt);
    return limit === undefined ? summaries : summaries.slice(0, limit);
  }

  /**
   * The most recent trace ids in the latest instance — used by the REPL completer.
   */
  recentTraceIds(limit: number): string[] {
    return this.recentRequests(undefined, limit).map(summary => summary.traceId);
  }

  /**
   * Every instance directory currently in the store, ordered most-recent first by
   * directory `mtime`.
   */
  list(): string[] {
    try {
      return fs.readdirSync(this.paths.root, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => ({name: entry.name, mtime: this.directoryMtime(entry.name)}))
        .sort((a, b) => b.mtime - a.mtime)
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  /**
   * The most recent instance id, or undefined when the store is empty.
   */
  latestInstanceId(): string | undefined {
    return this.list()[0];
  }

  private searchOrder(preferred?: string): string[] {
    const all = this.list();
    if (preferred === undefined) {
      return all;
    }
    return [preferred, ...all.filter(id => id !== preferred)];
  }

  private buildSummary(trace: Trace): RequestSummary {
    const context = trace.context ?? {};
    const summary = new RequestSummary(
      trace.id,
      trace.startDate,
      trace.getDuration(),
      trace.rootSpan?.keyname ?? "",
    );

    summary.httpMethod = context["http.method"];
    summary.httpPath = context["http.path"];

    const status = context["http.statusCode"];
    if (status !== undefined) {
      const parsed = Number(status);
      summary.httpStatus = Number.isNaN(parsed) ? undefined : parsed;
    }

    return summary;
  }

  private ensureInstanceDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.tracesDirectory(this.instanceId), {recursive: true});
    this.directoryEnsured = true;
    this.pruneOldInstances();
  }

  /**
   * Drops instance directories beyond the retained limit, ordered by `mtime`. Once per
   * process. Best-effort: a failure to prune never blocks a write.
   */
  private pruneOldInstances(): void {
    if (this.pruned) {
      return;
    }
    this.pruned = true;
    try {
      const ordered = fs.readdirSync(this.paths.root, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => ({name: entry.name, mtime: this.directoryMtime(entry.name)}))
        .sort((a, b) => b.mtime - a.mtime);
      for (const stale of ordered.slice(Math.max(this.retainedInstances, 1))) {
        fs.rmSync(this.paths.instanceDirectory(stale.name), {recursive: true, force: true});
      }
    } catch {
      // Best-effort.
    }
  }

  private directoryMtime(name: string): number {
    try {
      return fs.statSync(this.paths.instanceDirectory(name)).mtimeMs;
    } catch {
      return 0;
    }
  }

  private readJsonl<T>(filePath: string): T[] {
    try {
      return fs.readFileSync(filePath, "utf8")
        .split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => JSON.parse(line) as T);
    } catch {
      return [];
    }
  }
}
