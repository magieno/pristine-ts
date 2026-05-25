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
 * The read/write layer for captured traces. The `ObservabilityTracer` (a `Tracer`-
 * tagged transport) calls `append` on every completed trace; the CLI's `trace` and
 * `requests` commands call `find` / `recentRequests` / `recentTraceIds`. The REPL also
 * reads `recentTraceIds` for its tab-completion.
 *
 * Writes both `traces/<eventId>.json` (the full tree) and an appended one-line
 * `RequestSummary` in `requests.jsonl` (the fast index for `pristine requests`) as a
 * single coupled operation. The summary additionally serves as the lookup table that
 * resolves `requestId` / `traceId` back to the canonical `eventId` when they differ.
 *
 * Internally, each pristine process writes to its own per-process directory (keyed by
 * the kernel instantiation id) so concurrent processes never race. That partition is
 * invisible to callers — `find` and `recentRequests` walk every directory newest-first.
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
    @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly partitionId: string,
  ) {
    this.paths = new ObservabilityPaths(directory);
  }

  /**
   * Persists a completed trace: writes `traces/<eventId>.json` (the full tree) and
   * appends a `RequestSummary` to `requests.jsonl`. No-op when observability is
   * disabled.
   *
   * The summary's optional `traceId` / `requestId` fields are written only when they
   * differ from the canonical `eventId` (typically only `requestId` for HTTP requests
   * with an `x-pristine-request-id` header that disagreed with the mapper's event id,
   * and `traceId` for distributed-tracing scenarios). The common case is a one-id
   * line — `{eventId, startedAt, durationMs, rootKeyname, ...http}`.
   */
  append(trace: Trace): void {
    if (this.enabled === false) {
      return;
    }
    this.ensurePartitionDirectory();
    const eventId = this.eventIdOf(trace);
    const traceContent = traceRenderer.renderJson(trace);
    const summary = this.buildSummary(trace, eventId);
    const requestLine = JSON.stringify(summary) + "\n";
    fs.writeFileSync(this.paths.traceFile(this.partitionId, eventId), traceContent);
    fs.appendFileSync(this.paths.requestsFile(this.partitionId), requestLine);
  }

  /**
   * Finds and rehydrates a trace by any of `eventId` / `traceId` / `requestId`, returning
   * a `Trace` instance with its full span tree rebuilt (instance methods like
   * `getDuration()` work directly). Searches partitions newest-first.
   */
  find(id: string): {trace: Trace; eventId: string} | undefined {
    const serialized = this.findSerialized(id);
    if (serialized === undefined) {
      return undefined;
    }
    return {trace: TraceDeserializer.deserialize(serialized.trace), eventId: serialized.eventId};
  }

  /**
   * Same as `find`, but returns the raw stored JSON. The escape hatch for callers that
   * want to render the on-disk shape verbatim — e.g. `pristine trace --format json`.
   */
  findSerialized(id: string): {trace: SerializedTrace; eventId: string} | undefined {
    for (const partition of this.partitionsNewestFirst()) {
      // Try direct file lookup first — `id` IS the eventId in the common case.
      const direct = this.tryLoadTrace(partition, id);
      if (direct !== undefined) {
        return {trace: direct, eventId: id};
      }
      // Else resolve via the summary index — `id` might be a divergent traceId/requestId.
      const eventId = this.resolveEventIdFromSummaries(partition, id);
      if (eventId !== undefined) {
        const trace = this.tryLoadTrace(partition, eventId);
        if (trace !== undefined) {
          return {trace, eventId};
        }
      }
    }
    return undefined;
  }

  /**
   * Recent request summaries across every partition, most-recent first, optionally
   * capped to `limit`.
   */
  recentRequests(limit?: number): RequestSummary[] {
    const all: RequestSummary[] = [];
    for (const partition of this.partitionsNewestFirst()) {
      all.push(...this.readSummaries(partition));
    }
    all.sort((a, b) => b.startedAt - a.startedAt);
    return limit === undefined ? all : all.slice(0, limit);
  }

  /**
   * The most recent event ids across all partitions — used by the REPL completer.
   */
  recentTraceIds(limit: number): string[] {
    return this.recentRequests(limit).map(summary => summary.eventId);
  }

  private buildSummary(trace: Trace, eventId: string): RequestSummary {
    const context = trace.context ?? {};
    const summary = new RequestSummary(
      eventId,
      trace.startDate,
      trace.getDuration(),
      trace.rootSpan?.keyname ?? "",
    );

    // Only persist divergent ids — the common case is all three values equal.
    if (trace.id !== eventId) {
      summary.traceId = trace.id;
    }
    const requestId = context["request.id"];
    if (typeof requestId === "string" && requestId !== eventId) {
      summary.requestId = requestId;
    }

    summary.httpMethod = context["http.method"];
    summary.httpPath = context["http.path"];

    const status = context["http.statusCode"];
    if (status !== undefined) {
      const parsed = Number(status);
      summary.httpStatus = Number.isNaN(parsed) ? undefined : parsed;
    }

    return summary;
  }

  /**
   * The canonical id for a trace. Today the trace's own `id` is set from the kernel's
   * event id at trace creation, so they're equal. A custom `context["event.id"]`
   * override wins when present — that's the explicit hook for distributed-tracing setups
   * where the trace id was overwritten from a propagated `traceparent`.
   */
  private eventIdOf(trace: Trace): string {
    const fromContext = trace.context?.["event.id"];
    return typeof fromContext === "string" && fromContext.length > 0 ? fromContext : trace.id;
  }

  private resolveEventIdFromSummaries(partition: string, id: string): string | undefined {
    for (const summary of this.readSummaries(partition)) {
      if (summary.eventId === id || summary.traceId === id || summary.requestId === id) {
        return summary.eventId;
      }
    }
    return undefined;
  }

  private tryLoadTrace(partition: string, eventId: string): SerializedTrace | undefined {
    try {
      return JSON.parse(fs.readFileSync(this.paths.traceFile(partition, eventId), "utf8")) as SerializedTrace;
    } catch {
      return undefined;
    }
  }

  private readSummaries(partition: string): RequestSummary[] {
    return this.readJsonl<RequestSummary>(this.paths.requestsFile(partition));
  }

  private ensurePartitionDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.tracesDirectory(this.partitionId), {recursive: true});
    this.directoryEnsured = true;
    this.pruneOldPartitions();
  }

  /**
   * Drops partition directories beyond the retained limit, ordered by `mtime`. Once
   * per process. Best-effort: a failure to prune never blocks a write.
   */
  private pruneOldPartitions(): void {
    if (this.pruned) {
      return;
    }
    this.pruned = true;
    try {
      const ordered = this.partitionsNewestFirst();
      for (const stale of ordered.slice(Math.max(this.retainedInstances, 1))) {
        fs.rmSync(this.paths.instanceDirectory(stale), {recursive: true, force: true});
      }
    } catch {
      // Best-effort.
    }
  }

  private partitionsNewestFirst(): string[] {
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
