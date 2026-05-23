import * as fs from "fs";
import * as path from "path";
import {inject, injectable, singleton} from "tsyringe";
import {injectConfig, InternalContainerParameterEnum, moduleScoped} from "@pristine-ts/common";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {ObservabilityPaths} from "./observability-paths";
import {RunMetadata} from "../models/run-metadata.model";

/**
 * Owns the lifecycle of an observability run. A "run" is one `pristine start` lifetime;
 * the run directory is keyed by the kernel instantiation id.
 *
 * The observability writers (`ObservabilityLogger`, `ObservabilityTracer`) stay dormant
 * until `beginRun()` is called — so one-shot CLI commands (`build`, `logs`, `trace`) and
 * the REPL never pollute the store. `StartCommand` is the only caller of `beginRun()`.
 *
 * A singleton so the logger, the tracer, and `StartCommand` all share the same run state.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class ObservabilityRunManager {
  /**
   * Once the reclaimed run exceeds the budget we trim back to this fraction of it, so the
   * (relatively expensive) reclaim isn't re-triggered on the very next write.
   */
  private static readonly LOW_WATER_FRACTION = 0.8;

  private readonly paths: ObservabilityPaths;
  private activeRunDirectory?: string;

  /**
   * Approximate running total of bytes written to the active run. Incremented cheaply by
   * the writers via `recordBytesWritten`; resynced to the real on-disk total after each
   * reclaim. Used to decide when to enforce the per-run size budget without stat-ing the
   * whole run directory on every write.
   */
  private runBytes = 0;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Enabled) private readonly enabled: boolean,
    @injectConfig(ObservabilityConfigurationKeys.Directory) directory: string,
    @injectConfig(ObservabilityConfigurationKeys.RetainedRuns) private readonly retainedRuns: number,
    @injectConfig(ObservabilityConfigurationKeys.AutoBegin) private readonly autoBegin: boolean,
    @injectConfig(ObservabilityConfigurationKeys.MaxRunSizeBytes) private readonly maxRunSizeBytes: number,
    @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly runId: string,
  ) {
    this.paths = new ObservabilityPaths(directory);
  }

  /**
   * Begins a run: creates the run directory, writes `run.json`, repoints `latest.json`,
   * and prunes old runs. No-op when observability is disabled. Safe to call once per
   * process.
   */
  beginRun(command: string): void {
    if (this.enabled === false || this.activeRunDirectory !== undefined) {
      return;
    }

    const runDirectory = this.paths.runDirectory(this.runId);
    fs.mkdirSync(this.paths.tracesDirectory(this.runId), {recursive: true});

    const metadata = new RunMetadata(this.runId, new Date().toISOString(), process.pid, command);
    fs.writeFileSync(this.paths.runMetadataFile(this.runId), JSON.stringify(metadata, null, 2));
    fs.writeFileSync(this.paths.latestPointerFile(), JSON.stringify({runId: this.runId}, null, 2));

    this.activeRunDirectory = runDirectory;
    this.runBytes = 0;
    this.pruneOldRuns();
  }

  /**
   * Reports bytes just written to the run by a writer. Cheap — an add and a compare. When
   * the running total crosses the configured `maxRunSizeBytes`, triggers a reclaim that
   * drops the run's oldest data. No-op when no run is active or the cap is disabled.
   */
  recordBytesWritten(bytes: number): void {
    if (this.activeRunDirectory === undefined || this.maxRunSizeBytes <= 0) {
      return;
    }

    this.runBytes += bytes;
    if (this.runBytes > this.maxRunSizeBytes) {
      this.reclaim();
    }
  }

  /**
   * Ends the active run by stamping `endedAt` into `run.json`. No-op when no run is active.
   */
  endRun(): void {
    if (this.activeRunDirectory === undefined) {
      return;
    }

    try {
      const file = this.paths.runMetadataFile(this.runId);
      const metadata = JSON.parse(fs.readFileSync(file, "utf8")) as RunMetadata;
      metadata.endedAt = new Date().toISOString();
      fs.writeFileSync(file, JSON.stringify(metadata, null, 2));
    } catch {
      // The run directory may have been pruned/removed out from under us — nothing to do.
    }

    this.activeRunDirectory = undefined;
  }

  /**
   * Whether a run is currently active. The writers consult this on every write.
   */
  isRunActive(): boolean {
    return this.enabled && this.activeRunDirectory !== undefined;
  }

  /**
   * The absolute logs file for the active run, or undefined when no run is active.
   */
  logsFile(): string | undefined {
    this.ensureAutoBegun();
    return this.activeRunDirectory === undefined ? undefined : this.paths.logsFile(this.runId);
  }

  /**
   * The absolute requests-index file for the active run, or undefined when no run is active.
   */
  requestsFile(): string | undefined {
    this.ensureAutoBegun();
    return this.activeRunDirectory === undefined ? undefined : this.paths.requestsFile(this.runId);
  }

  /**
   * The absolute path of the trace file for a given trace id in the active run, or
   * undefined when no run is active.
   */
  traceFile(traceId: string): string | undefined {
    this.ensureAutoBegun();
    return this.activeRunDirectory === undefined ? undefined : this.paths.traceFile(this.runId, traceId);
  }

  /**
   * Lazily begins a run when `autoBegin` is configured and none is active yet — so a
   * server started outside the `pristine` CLI captures its logs/traces on the first
   * write, with nothing calling `beginRun()` explicitly.
   */
  private ensureAutoBegun(): void {
    if (this.activeRunDirectory === undefined && this.autoBegin) {
      this.beginRun("auto");
    }
  }

  /**
   * Drops the run's oldest data until it is back under the budget's low-water mark:
   * oldest trace files first, then the head of `logs.jsonl` (keeping the newest tail).
   * The `requests.jsonl` index is rewritten to drop entries for deleted traces.
   *
   * Best-effort and fully guarded — budget enforcement must never break or lose a write.
   */
  private reclaim(): void {
    if (this.activeRunDirectory === undefined) {
      return;
    }

    try {
      const lowWater = Math.floor(this.maxRunSizeBytes * ObservabilityRunManager.LOW_WATER_FRACTION);
      const logsFile = this.paths.logsFile(this.runId);
      const requestsFile = this.paths.requestsFile(this.runId);
      const tracesDirectory = this.paths.tracesDirectory(this.runId);

      const sizeOf = (file: string): number => {
        try {
          return fs.statSync(file).size;
        } catch {
          return 0;
        }
      };

      let traceFiles: {path: string; size: number; mtime: number}[] = [];
      try {
        traceFiles = fs.readdirSync(tracesDirectory).map(name => {
          const filePath = path.join(tracesDirectory, name);
          const stats = fs.statSync(filePath);
          return {path: filePath, size: stats.size, mtime: stats.mtimeMs};
        }).sort((a, b) => a.mtime - b.mtime);
      } catch {
        // No traces directory yet — nothing to drop on that side.
      }

      let total = sizeOf(logsFile) + sizeOf(requestsFile) + traceFiles.reduce((sum, file) => sum + file.size, 0);

      // Drop oldest trace files until under the low-water mark (or none remain).
      let tracesDeleted = false;
      while (total > lowWater && traceFiles.length > 0) {
        const oldest = traceFiles.shift()!;
        try {
          fs.rmSync(oldest.path, {force: true});
          total -= oldest.size;
          tracesDeleted = true;
        } catch {
          break;
        }
      }

      // Still over — trim the head of logs.jsonl, keeping the newest tail.
      if (total > lowWater) {
        const logsSize = sizeOf(logsFile);
        const keep = Math.max(0, lowWater - (total - logsSize));
        if (logsSize > keep) {
          this.trimFileHead(logsFile, keep);
          total = total - logsSize + sizeOf(logsFile);
        }
      }

      if (tracesDeleted) {
        this.pruneRequestsIndex();
        total = sizeOf(logsFile) + sizeOf(requestsFile)
          + this.directoryTotalSize(tracesDirectory);
      }

      this.runBytes = total;
    } catch {
      // Best-effort — never let budget enforcement break a write.
    }
  }

  /**
   * Rewrites a file in place keeping only its last `keepBytes` bytes, aligned forward to
   * the next newline so no partial line survives.
   */
  private trimFileHead(file: string, keepBytes: number): void {
    const size = fs.statSync(file).size;
    if (size <= keepBytes) {
      return;
    }

    const buffer = Buffer.alloc(keepBytes);
    const fd = fs.openSync(file, "r");
    try {
      fs.readSync(fd, buffer, 0, keepBytes, size - keepBytes);
    } finally {
      fs.closeSync(fd);
    }

    const newlineIndex = buffer.indexOf(0x0a);
    const content = newlineIndex === -1 ? Buffer.alloc(0) : buffer.subarray(newlineIndex + 1);
    fs.writeFileSync(file, content);
  }

  /**
   * Rewrites `requests.jsonl` keeping only entries whose trace file still exists — so the
   * request index stays consistent after trace files are reclaimed.
   */
  private pruneRequestsIndex(): void {
    const requestsFile = this.paths.requestsFile(this.runId);
    try {
      const kept = fs.readFileSync(requestsFile, "utf8")
        .split("\n")
        .filter(line => line.trim().length > 0)
        .filter(line => {
          try {
            const traceId = JSON.parse(line).traceId;
            return typeof traceId === "string" && fs.existsSync(this.paths.traceFile(this.runId, traceId));
          } catch {
            return false;
          }
        });
      fs.writeFileSync(requestsFile, kept.length > 0 ? kept.join("\n") + "\n" : "");
    } catch {
      // Best-effort.
    }
  }

  /**
   * Sum of the sizes of every file directly inside `directory`.
   */
  private directoryTotalSize(directory: string): number {
    try {
      return fs.readdirSync(directory).reduce((sum, name) => {
        try {
          return sum + fs.statSync(path.join(directory, name)).size;
        } catch {
          return sum;
        }
      }, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Removes run directories beyond the retained limit, ordered by their
   * `run.json:startedAt`. Best-effort — a failure to prune never blocks a run.
   */
  private pruneOldRuns(): void {
    try {
      const runsDirectory = this.paths.runsDirectory();
      const entries = fs.readdirSync(runsDirectory, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => {
          let startedAt = 0;
          try {
            const metadataPath = this.paths.runMetadataFile(entry.name);
            const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as RunMetadata;
            startedAt = Date.parse(metadata.startedAt);
          } catch {
            // Missing/corrupt run.json — treat as oldest so it's pruned first.
          }
          return {name: entry.name, startedAt};
        })
        .sort((a, b) => b.startedAt - a.startedAt);

      for (const stale of entries.slice(Math.max(this.retainedRuns, 1))) {
        fs.rmSync(this.paths.runDirectory(stale.name), {recursive: true, force: true});
      }
    } catch {
      // Best-effort retention; never block the run on a cleanup failure.
    }
  }
}
