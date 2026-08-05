import * as fs from "fs";
import {injectable, singleton} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {LogModel} from "@pristine-ts/logging";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {ObservabilityPaths} from "../paths/observability-paths";
import {LogTailer} from "../tailers/log-tailer";
import {SafeStringifier} from "../utils/safe-stringifier";
import {JsonlReader} from "../utils/jsonl-reader";
import {LogStoreReadOptions} from "../options/log-store-read-options";
import {PartitionIndex} from "./partition-index";
import {RotatingJsonlWriter} from "./rotating-jsonl-writer";
import {StoreBudgetEnforcer} from "./store-budget-enforcer";

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
 * **Disk is bounded on three axes**, because a long-running process would otherwise
 * append to one `logs.jsonl` for its entire lifetime — instance-directory retention only
 * ever prunes *other* processes' directories:
 *
 * - per entry — anything past `maxEntrySize` is rewritten without its `extra` payload;
 * - per file — `RotatingJsonlWriter` rolls over at `maxLogFileSize`, keeping `maxLogFiles`;
 * - per store — `StoreBudgetEnforcer` holds the whole directory under `maxStoreSize`.
 *
 * Entries below `logSeverityLevelConfiguration` are dropped at write time, so debug
 * traffic the console already hides does not quietly fill the disk.
 *
 * Singleton so both the writer (logger) and any reader resolved during the same
 * process see the same in-memory state.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class LogStore {
  private readonly paths: ObservabilityPaths;
  private readonly stringifier: SafeStringifier;
  private readonly writer: RotatingJsonlWriter;
  private directoryEnsured = false;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Enabled) private readonly enabled: boolean,
    @injectConfig(ObservabilityConfigurationKeys.MaxEntrySize) private readonly maxEntrySize: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxLogFileSize) maxLogFileSize: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxLogFiles) private readonly maxLogFiles: number,
    @injectConfig(ObservabilityConfigurationKeys.LogSeverityLevelConfiguration) private readonly logSeverityLevelConfiguration: number,
    private readonly partitions: PartitionIndex,
    private readonly budget: StoreBudgetEnforcer,
  ) {
    this.paths = partitions.paths;
    this.stringifier = new SafeStringifier();
    this.writer = new RotatingJsonlWriter(
      this.paths.logsFile(partitions.currentPartitionId),
      maxLogFileSize,
      maxLogFiles,
      (bytes, rotated) => this.budget.recordBytes(bytes, rotated),
    );
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
   * observability is disabled or when the entry is below the configured severity
   * threshold.
   *
   * The on-disk shape is the JSON-serialized `LogModel` itself — `severity` stays a
   * numeric `SeverityEnum`, `date` becomes an ISO string — so the `logs` command can
   * round-trip through `PrettyLogFormatter`. Serialization goes through
   * `SafeStringifier`: `log.extra` routinely holds `Span`/`Trace` objects whose
   * `parentSpan` ↔ `children` back-references would blow up a naive serializer, and
   * whose expanded tree can dwarf the entry it decorates.
   */
  append(log: LogModel): void {
    if (this.enabled === false || this.isBelowThreshold(log)) {
      return;
    }
    this.ensurePartitionDirectory();
    this.writer.append(this.serialize(log));
  }

  /**
   * Every captured log entry across every partition, in write order within each
   * partition (rotated generations included, oldest first) and partitions concatenated
   * newest-first. When `id` is provided, only entries whose `traceId` / `eventId` /
   * `requestId` match are returned — useful for `pristine logs <id>`.
   *
   * `options.limit` caps how many entries are collected and reads from the newest end,
   * so `pristine logs --limit 100` against a multi-megabyte store touches only the tail
   * of one file. Without a limit the whole store is materialized — the caller's choice.
   */
  read(id?: string, options: LogStoreReadOptions = {}): Record<string, any>[] {
    const limit = options.limit;
    const entries: Record<string, any>[] = [];

    for (const partition of this.partitions.newestFirst()) {
      const files = RotatingJsonlWriter.existingFiles(this.paths.logsFile(partition), this.maxLogFiles);
      const partitionEntries: Record<string, any>[] = [];

      // Newest file first, newest line first within it, so a limit keeps the most recent
      // entries. The partition's entries are flipped back into write order below.
      for (let index = files.length - 1; index >= 0; index--) {
        if (limit !== undefined && entries.length + partitionEntries.length >= limit) {
          break;
        }
        JsonlReader.forEachLineReverse(files[index], line => {
          const entry = LogStore.parseLine(line);
          if (entry === undefined || (id !== undefined && LogStore.entryMatchesId(entry, id) === false)) {
            return;
          }
          partitionEntries.push(entry);
          return limit === undefined || entries.length + partitionEntries.length < limit;
        });
      }

      entries.push(...partitionEntries.reverse());
      if (limit !== undefined && entries.length >= limit) {
        break;
      }
    }

    return entries;
  }

  /**
   * Follows the most-recently-written partition's `logs.jsonl`, emitting each newly-
   * appended line until the returned handle's `stop()` is called. When `id` is
   * provided, only matching entries surface. Returns a no-op handle when the store
   * has no partitions yet.
   *
   * A rollover is transparent: `LogTailer` resets to the new end when the file it
   * follows shrinks, so following resumes on the fresh generation.
   */
  tail(id: string | undefined, onLine: (line: string) => void): { stop(): void } {
    const partition = this.partitions.newestFirst()[0];
    if (partition === undefined) {
      return {stop: () => undefined};
    }
    const tailer = new LogTailer(this.paths.logsFile(partition));
    tailer.follow(line => {
      if (id === undefined) {
        onLine(line);
        return;
      }
      const entry = LogStore.parseLine(line);
      if (entry !== undefined && LogStore.entryMatchesId(entry, id)) {
        onLine(line);
      }
    });
    return {stop: () => tailer.stop()};
  }

  /**
   * Serializes the entry within `maxEntrySize`. An entry that busts the ceiling is
   * rewritten **without** its `extra` payload and flagged with `extraOmitted` — that
   * payload is the only unbounded part of a log, and dropping it preserves every
   * correlation field (`eventId` / `traceId` / `severity` / `message`) so the entry still
   * surfaces in a filtered query.
   */
  private serialize(log: LogModel): string {
    const line = this.stringifier.stringify(log);
    if (this.maxEntrySize <= 0 || Buffer.byteLength(line) <= this.maxEntrySize) {
      return line;
    }

    const {extra, ...rest} = log as unknown as Record<string, unknown>;
    const withoutExtra = this.stringifier.stringify({...rest, extraOmitted: true});
    if (Buffer.byteLength(withoutExtra) <= this.maxEntrySize) {
      return withoutExtra;
    }

    // Still too large without `extra` — a pathological `message` or `highlights`. Keep
    // only what a query needs.
    return this.stringifier.stringify({
      severity: log.severity,
      date: log.date,
      eventId: log.eventId,
      traceId: log.traceId,
      kernelInstantiationId: log.kernelInstantiationId,
      message: typeof log.message === "string" ? log.message.slice(0, 1024) : log.message,
      extraOmitted: true,
      truncated: true,
    });
  }

  private isBelowThreshold(log: LogModel): boolean {
    return typeof log.severity === "number" && log.severity < this.logSeverityLevelConfiguration;
  }

  private ensurePartitionDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.instanceDirectory(this.partitions.currentPartitionId), {recursive: true});
    this.directoryEnsured = true;
    this.partitions.claim();
    this.budget.enforce();
  }

  private static parseLine(line: string): Record<string, any> | undefined {
    try {
      return JSON.parse(line) as Record<string, any>;
    } catch {
      // Skip malformed lines rather than aborting the read.
      return undefined;
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
}
