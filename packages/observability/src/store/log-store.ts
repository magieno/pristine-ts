import * as fs from "fs";
import {inject, injectable, singleton} from "tsyringe";
import {injectConfig, InternalContainerParameterEnum, moduleScoped} from "@pristine-ts/common";
import {LogModel} from "@pristine-ts/logging";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {ObservabilityPaths} from "../paths/observability-paths";
import {LogTailer} from "../tailers/log-tailer";

/**
 * The read/write layer for captured logs. The `ObservabilityLogger` (a `Logger`-tagged
 * transport) calls `append` on every log it sees. The CLI's `logs` command calls `read`
 * / `tail` — addressed by event/trace/request id, never by a partition selector.
 *
 * Internally, each pristine process writes to its own per-process directory (keyed by
 * the kernel instantiation id) so concurrent processes never race on the same file.
 * That partition is invisible to callers: `read` walks every directory newest-first and
 * concatenates; `tail` follows the most-recently-written directory.
 *
 * Singleton so both the writer (logger) and any reader resolved during the same
 * process see the same in-memory state.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class LogStore {
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
   * Whether capture is on. The `LoggerInterface` contract surfaces this through the
   * adapter so `LogHandler` can skip dispatch entirely for disabled stores.
   */
  isCaptureEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Appends one log entry to the current process's `logs.jsonl`. No-op when
   * observability is disabled.
   *
   * The on-disk shape is the JSON-serialized `LogModel` itself — `severity` stays a
   * numeric `SeverityEnum`, `date` becomes an ISO string — so the `logs` command can
   * round-trip through `PrettyLogFormatter`. Stringification is cycle-safe because
   * `log.extra` routinely holds `Span`/`Trace` objects whose `parentSpan` ↔ `children`
   * back-references would otherwise blow up a naive serializer.
   */
  append(log: LogModel): void {
    if (this.enabled === false) {
      return;
    }
    this.ensurePartitionDirectory();
    const line = LogStore.safeStringify(log) + "\n";
    fs.appendFileSync(this.paths.logsFile(this.partitionId), line);
  }

  /**
   * Every captured log entry across every partition, in write order within each
   * partition and partitions concatenated newest-first. When `id` is provided, only
   * entries whose `traceId` / `eventId` / `requestId` match are returned — useful for
   * `pristine logs <id>`.
   */
  read(id?: string): Record<string, any>[] {
    const entries: Record<string, any>[] = [];
    for (const partition of this.partitionsNewestFirst()) {
      for (const entry of this.readJsonl(this.paths.logsFile(partition))) {
        if (id === undefined || LogStore.entryMatchesId(entry, id)) {
          entries.push(entry);
        }
      }
    }
    return entries;
  }

  /**
   * Follows the most-recently-written partition's `logs.jsonl`, emitting each newly-
   * appended line until the returned handle's `stop()` is called. When `id` is
   * provided, only matching entries surface. Returns a no-op handle when the store
   * has no partitions yet.
   */
  tail(id: string | undefined, onLine: (line: string) => void): { stop(): void } {
    const partition = this.latestPartition();
    if (partition === undefined) {
      return {stop: () => undefined};
    }
    const tailer = new LogTailer(this.paths.logsFile(partition));
    tailer.follow(line => {
      if (id === undefined) {
        onLine(line);
        return;
      }
      try {
        if (LogStore.entryMatchesId(JSON.parse(line), id)) {
          onLine(line);
        }
      } catch {
        // Skip malformed lines rather than aborting the follow.
      }
    });
    return {stop: () => tailer.stop()};
  }

  private ensurePartitionDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.instanceDirectory(this.partitionId), {recursive: true});
    this.directoryEnsured = true;
    this.pruneOldPartitions();
  }

  /**
   * Drops partition directories beyond the retained limit, ordered by `mtime`. Once
   * per process — additional appends are zero-cost. Best-effort: a failure to prune
   * never blocks a write.
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

  private latestPartition(): string | undefined {
    return this.partitionsNewestFirst()[0];
  }

  private directoryMtime(name: string): number {
    try {
      return fs.statSync(this.paths.instanceDirectory(name)).mtimeMs;
    } catch {
      return 0;
    }
  }

  private readJsonl(filePath: string): Record<string, any>[] {
    try {
      return fs.readFileSync(filePath, "utf8")
        .split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => JSON.parse(line) as Record<string, any>);
    } catch {
      return [];
    }
  }

  /**
   * True when any of the entry's correlation fields match the requested id.
   * `requestId` is checked too even though `LogModel` doesn't define it as a field
   * today — JSON deserialization is permissive, so a custom mapper that does set it
   * will round-trip and match.
   */
  private static entryMatchesId(entry: Record<string, any>, id: string): boolean {
    return entry.traceId === id || entry.eventId === id || entry.requestId === id;
  }

  /**
   * `JSON.stringify` with a cycle guard — an object seen earlier in the walk is rendered
   * as `"[Circular]"` rather than recursed into. Faithful at any depth, and immune to the
   * `Span.parentSpan` ↔ `Span.children` cycles common in `log.extra`.
   */
  private static safeStringify(value: unknown): string {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) {
          return "[Circular]";
        }
        seen.add(val);
      }
      return val;
    });
  }
}
