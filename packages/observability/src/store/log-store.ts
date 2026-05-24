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
 * transport) calls `append` on every log it sees. The CLI's `logs` command (and
 * `pristine logs --follow`) calls `read`/`tail`.
 *
 * Each pristine process writes to its own directory (keyed by the kernel instantiation
 * id) so two processes never race on the same file. No begin/end ceremony: the directory
 * is lazy-created on first append. Retention is by whole-instance count — when the
 * configured limit is exceeded, the oldest instance directories are deleted atomically.
 *
 * Singleton so both the writer (logger) and any reader resolved during the same process
 * see the same in-memory state (e.g., the `pruned` flag).
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
    @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly instanceId: string,
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
   * Appends one log entry to the current instance's `logs.jsonl`. No-op when observability
   * is disabled.
   *
   * The on-disk shape is the JSON-serialized `LogModel` itself — `severity` stays a numeric
   * `SeverityEnum`, `date` becomes an ISO string — so the `logs` command can round-trip
   * through `PrettyLogFormatter`. Stringification is cycle-safe because `log.extra`
   * routinely holds `Span`/`Trace` objects whose `parentSpan` ↔ `children` back-references
   * would otherwise blow up a naive serializer.
   */
  append(log: LogModel): void {
    if (this.enabled === false) {
      return;
    }
    this.ensureInstanceDirectory();
    const line = LogStore.safeStringify(log) + "\n";
    fs.appendFileSync(this.paths.logsFile(this.instanceId), line);
  }

  /**
   * Reads every captured log entry for an instance, in write order. Defaults to the most
   * recent instance when none is specified. Returns an empty array when the store is empty
   * or the file is unreadable.
   */
  read(instanceId?: string): Record<string, any>[] {
    const id = instanceId ?? this.latestInstanceId();
    if (id === undefined) {
      return [];
    }
    return this.readJsonl(this.paths.logsFile(id));
  }

  /**
   * Follows the current instance's `logs.jsonl`, emitting each newly-appended line until
   * the returned handle's `stop()` is called. Defaults to the most recent instance.
   * Returns a no-op handle when there is no instance to tail.
   */
  tail(instanceId: string | undefined, onLine: (line: string) => void): { stop(): void } {
    const id = instanceId ?? this.latestInstanceId();
    if (id === undefined) {
      return {stop: () => undefined};
    }
    const tailer = new LogTailer(this.paths.logsFile(id));
    tailer.follow(onLine);
    return {stop: () => tailer.stop()};
  }

  /**
   * Every instance directory currently in the store, ordered most-recent first by directory
   * `mtime`.
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

  private ensureInstanceDirectory(): void {
    if (this.directoryEnsured) {
      return;
    }
    fs.mkdirSync(this.paths.instanceDirectory(this.instanceId), {recursive: true});
    this.directoryEnsured = true;
    this.pruneOldInstances();
  }

  /**
   * Drops instance directories beyond the retained limit, ordered by `mtime`. Once per
   * process — additional appends are zero-cost. Best-effort: a failure to prune never
   * blocks a write.
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
