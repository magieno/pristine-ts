import * as fs from "fs";
import {injectable} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {ObservabilityPaths} from "./observability-paths";
import {RunMetadata} from "../models/run-metadata.model";
import {RequestSummary} from "../models/request-summary.model";
import {SerializedTrace} from "./trace-deserializer";

/**
 * Read-only access to the observability store. Used by the `logs`, `trace` and `requests`
 * CLI commands. Pure filesystem reads — no kernel, no running app required; it reads what
 * a separate `pristine start` process wrote.
 */
@moduleScoped(ObservabilityModuleKeyname)
@injectable()
export class ObservabilityStoreReader {
  private readonly paths: ObservabilityPaths;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Directory) directory: string,
  ) {
    this.paths = new ObservabilityPaths(directory);
  }

  /**
   * The run id the `latest.json` pointer references, or undefined when the store is empty.
   */
  latestRunId(): string | undefined {
    try {
      const pointer = JSON.parse(fs.readFileSync(this.paths.latestPointerFile(), "utf8"));
      return typeof pointer?.runId === "string" ? pointer.runId : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Resolves an explicit run id, or falls back to the latest run.
   */
  resolveRunId(explicit?: string): string | undefined {
    return explicit ?? this.latestRunId();
  }

  /**
   * Every run's metadata, most-recent first.
   */
  listRuns(): RunMetadata[] {
    try {
      return fs.readdirSync(this.paths.runsDirectory(), {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => this.readRunMetadata(entry.name))
        .filter((metadata): metadata is RunMetadata => metadata !== undefined)
        .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
    } catch {
      return [];
    }
  }

  /**
   * Reads a run's `run.json`, or undefined when absent/corrupt.
   */
  readRunMetadata(runId: string): RunMetadata | undefined {
    try {
      return JSON.parse(fs.readFileSync(this.paths.runMetadataFile(runId), "utf8")) as RunMetadata;
    } catch {
      return undefined;
    }
  }

  /**
   * The request summaries for a run, most-recent first, optionally capped to `limit`.
   */
  readRequests(runId: string, limit?: number): RequestSummary[] {
    const summaries = this.readJsonl<RequestSummary>(this.paths.requestsFile(runId))
      .sort((a, b) => b.startedAt - a.startedAt);
    return limit === undefined ? summaries : summaries.slice(0, limit);
  }

  /**
   * The raw log entries for a run, in write order. Each is a parsed `logs.jsonl` line.
   */
  readLogs(runId: string): Record<string, any>[] {
    return this.readJsonl<Record<string, any>>(this.paths.logsFile(runId));
  }

  /**
   * The absolute `logs.jsonl` path for a run — handed to `LogTailer` for `--follow`.
   */
  logsFilePath(runId: string): string {
    return this.paths.logsFile(runId);
  }

  /**
   * Finds and reads a trace by id. Searches the preferred run first (when given), then
   * every other run most-recent first. Returns the parsed trace and the run it was found
   * in, or undefined when no run contains it.
   */
  findTrace(traceId: string, preferredRunId?: string): {trace: SerializedTrace; runId: string} | undefined {
    const runIds = this.listRuns().map(run => run.runId);
    const ordered = preferredRunId === undefined
      ? runIds
      : [preferredRunId, ...runIds.filter(id => id !== preferredRunId)];

    for (const runId of ordered) {
      try {
        const trace = JSON.parse(fs.readFileSync(this.paths.traceFile(runId, traceId), "utf8")) as SerializedTrace;
        return {trace, runId};
      } catch {
        // Not in this run — keep looking.
      }
    }
    return undefined;
  }

  /**
   * The most recently seen trace ids across the latest run — used by the REPL completer.
   */
  recentTraceIds(limit: number): string[] {
    const runId = this.latestRunId();
    if (runId === undefined) {
      return [];
    }
    return this.readRequests(runId, limit).map(summary => summary.traceId);
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
