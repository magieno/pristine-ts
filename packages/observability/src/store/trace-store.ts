import * as fs from "fs";
import * as path from "path";
import {injectable, singleton} from "tsyringe";
import {injectConfig, moduleScoped, Trace} from "@pristine-ts/common";
import {traceRenderer} from "@pristine-ts/telemetry";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {RequestSummary} from "../models/request-summary.model";
import {ObservabilityPaths} from "../paths/observability-paths";
import {SerializedTrace} from "../interfaces/serialized-trace.interface";
import {TraceDeserializer} from "../serializers/trace-deserializer";
import {JsonlReader} from "../utils/jsonl-reader";
import {PartitionIndex} from "./partition-index";
import {RotatingJsonlWriter} from "./rotating-jsonl-writer";
import {StoreBudgetEnforcer} from "./store-budget-enforcer";
import {TraceFileRetention} from "./trace-file-retention";

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
 * **Disk is bounded on three axes.** Traces are one file per request, so a busy server
 * exhausts directory entries long before any byte quota would notice:
 *
 * - per trace — a rendered tree past `maxTraceFileSize` is not written at all, and its
 *   summary carries `traceOmitted` so `pristine requests` still lists the request;
 * - per partition — `TraceFileRetention` keeps at most `maxTraceFiles` trace files, and
 *   `requests.jsonl` rotates like the log file;
 * - per store — `StoreBudgetEnforcer` holds the whole directory under `maxStoreSize`.
 *
 * Singleton so multiple appenders within the same process share the writer and the
 * retention bookkeeping.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class TraceStore {
  private readonly paths: ObservabilityPaths;
  private readonly writer: RotatingJsonlWriter;
  private readonly traceRetention: TraceFileRetention;
  private directoryEnsured = false;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Enabled) private readonly enabled: boolean,
    @injectConfig(ObservabilityConfigurationKeys.MaxTraceFiles) maxTraceFiles: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxTraceFileSize) private readonly maxTraceFileSize: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxLogFileSize) maxLogFileSize: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxLogFiles) private readonly maxLogFiles: number,
    private readonly partitions: PartitionIndex,
    private readonly budget: StoreBudgetEnforcer,
  ) {
    this.paths = partitions.paths;
    this.writer = new RotatingJsonlWriter(
      this.paths.requestsFile(partitions.currentPartitionId),
      maxLogFileSize,
      maxLogFiles,
      (bytes, rotated) => this.budget.recordBytes(bytes, rotated),
    );
    this.traceRetention = new TraceFileRetention(
      this.paths.tracesDirectory(partitions.currentPartitionId),
      maxTraceFiles,
    );
    // A store-wide sweep may delete trace files this process wrote; the retention cache
    // has to re-read the directory afterwards.
    this.budget.onCurrentPartitionPruned(() => this.traceRetention.invalidate());
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
   *
   * The summary is appended even when the trace file itself is skipped for size: a
   * missing trace is recoverable (the request is still listed, `pristine trace <id>`
   * says it was dropped), a missing index entry is not.
   */
  append(trace: Trace): void {
    if (this.enabled === false) {
      return;
    }
    this.ensurePartitionDirectory();
    const eventId = this.eventIdOf(trace);
    const summary = this.buildSummary(trace, eventId);

    const traceContent = traceRenderer.renderJson(trace);
    if (this.maxTraceFileSize > 0 && Buffer.byteLength(traceContent) > this.maxTraceFileSize) {
      summary.traceOmitted = true;
    } else {
      const traceFile = this.paths.traceFile(this.partitions.currentPartitionId, eventId);
      fs.writeFileSync(traceFile, traceContent);
      this.budget.recordBytes(Buffer.byteLength(traceContent));
      this.traceRetention.register(path.basename(traceFile));
    }

    this.writer.append(JSON.stringify(summary));
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
    for (const partition of this.partitions.newestFirst()) {
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
   * capped to `limit`. The limit is pushed down into the reader: with one set, only the
   * tail of each `requests.jsonl` is touched instead of the whole file.
   */
  recentRequests(limit?: number): RequestSummary[] {
    const all: RequestSummary[] = [];
    for (const partition of this.partitions.newestFirst()) {
      all.push(...this.readSummaries(partition, limit));
      if (limit !== undefined && all.length >= limit) {
        // More partitions can still hold newer entries only if clocks disagree; the sort
        // below settles the order among what we collected.
        break;
      }
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

  /**
   * Summaries for a partition in write order, across every rotated generation of
   * `requests.jsonl`. With a `limit`, only the newest entries are read.
   */
  private readSummaries(partition: string, limit?: number): RequestSummary[] {
    const files = RotatingJsonlWriter.existingFiles(this.paths.requestsFile(partition), this.maxLogFiles);
    const summaries: RequestSummary[] = [];

    // Newest generation first so a limit keeps the most recent summaries; the result is
    // flipped back into write order at the end.
    for (let index = files.length - 1; index >= 0; index--) {
      if (limit !== undefined && summaries.length >= limit) {
        break;
      }
      const remaining = limit === undefined ? undefined : limit - summaries.length;
      summaries.push(...JsonlReader.parse<RequestSummary>(files[index], {limit: remaining, newestFirst: true}).reverse());
    }

    return summaries.reverse();
  }

  private ensurePartitionDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.tracesDirectory(this.partitions.currentPartitionId), {recursive: true});
    this.directoryEnsured = true;
    this.partitions.claim();
    this.budget.enforce();
  }
}
