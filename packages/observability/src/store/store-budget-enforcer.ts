import * as fs from "fs";
import * as path from "path";
import {injectable, singleton} from "tsyringe";
import {injectConfig, moduleScoped} from "@pristine-ts/common";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {PartitionIndex} from "./partition-index";
import {RotatingJsonlWriter} from "./rotating-jsonl-writer";

/**
 * The store-wide ceiling. Per-file rotation and the trace-file cap bound what *one*
 * process writes; this bounds what the store as a whole occupies, across every partition
 * and every process, which is the number an operator actually cares about ("observability
 * must never cost me more than 100 MB").
 *
 * Reclaims in increasing order of destructiveness:
 *
 * 1. Partitions past the age limit, and partitions past the retained-instance count —
 *    unless a running process still owns them.
 * 2. Whole abandoned partitions, oldest first, while the store is over budget.
 * 3. Individual files inside the surviving partitions, oldest first — rotated `.jsonl`
 *    generations and trace files only. The live `logs.jsonl` / `requests.jsonl` of a
 *    running process are never touched, so no writer ever loses the file under its feet.
 *
 * Sweeps are not run per append: writers report their bytes through `recordBytes`, and a
 * sweep is triggered once the unaccounted volume since the last one crosses a fraction of
 * the budget. A full sweep stats every file in the store, so this keeps the steady-state
 * cost near zero while still reacting long before the ceiling is reached.
 *
 * Singleton so the log and trace writers share one accounting.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class StoreBudgetEnforcer {
  /**
   * A sweep runs once this many bytes have been written since the previous one — 5% of
   * the budget, floored at 1 MB so a tiny configured budget doesn't sweep on every line.
   */
  private static readonly SWEEP_FRACTION = 0.05;
  private static readonly MINIMUM_SWEEP_INTERVAL = 1024 * 1024;

  private pendingBytes = 0;
  private readonly invalidationListeners: (() => void)[] = [];

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.MaxStoreSize) private readonly maxStoreSize: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxRetentionAgeInMilliseconds) private readonly maxRetentionAge: number,
    @injectConfig(ObservabilityConfigurationKeys.RetainedInstances) private readonly retainedInstances: number,
    @injectConfig(ObservabilityConfigurationKeys.MaxLogFiles) private readonly maxLogFiles: number,
    private readonly partitions: PartitionIndex,
  ) {
  }

  /**
   * Registers a callback fired after a sweep deleted files from the **current** process's
   * partition. `TraceStore` uses it to drop the file list it caches, which the sweep may
   * have invalidated.
   */
  onCurrentPartitionPruned(listener: () => void): void {
    this.invalidationListeners.push(listener);
  }

  /**
   * Reports bytes written by a store. Triggers a sweep once enough has accumulated.
   * `rotated` forces one: a rollover is exactly the moment a partition's footprint jumps.
   */
  recordBytes(bytes: number, rotated = false): void {
    this.pendingBytes += bytes;
    if (rotated || this.pendingBytes >= this.sweepInterval()) {
      this.enforce();
    }
  }

  /**
   * Runs a full sweep now. Called on process start (when the partition directory is
   * created) and whenever `recordBytes` decides enough has changed. Never throws — a
   * retention failure must not break the write that triggered it.
   */
  enforce(): void {
    this.pendingBytes = 0;
    try {
      const survivors = this.dropExpiredPartitions();
      if (this.maxStoreSize <= 0) {
        // A non-positive budget means "no byte ceiling" — count/age retention still ran.
        return;
      }

      let total = survivors.reduce((sum, partition) => sum + this.partitions.sizeOf(partition), 0);
      if (total <= this.maxStoreSize) {
        return;
      }

      total = this.dropAbandonedPartitions(survivors, total);
      if (total > this.maxStoreSize) {
        this.trimFiles(survivors, total);
      }
    } catch {
      // Best-effort, always.
    }
  }

  /**
   * Applies the age limit and the retained-instance count. Returns the partitions that
   * survived, newest first.
   */
  private dropExpiredPartitions(): string[] {
    const now = Date.now();
    const retained = Math.max(this.retainedInstances, 1);
    const survivors: string[] = [];

    this.partitions.newestFirst().forEach((partition, index) => {
      const expired = this.maxRetentionAge > 0 && now - this.partitions.mtimeOf(partition) > this.maxRetentionAge;
      const beyondCount = index >= retained;

      if ((expired || beyondCount) && this.partitions.isLive(partition) === false) {
        this.partitions.remove(partition);
        return;
      }
      survivors.push(partition);
    });

    return survivors;
  }

  /**
   * Deletes whole partitions that no process owns, oldest first, until the store fits.
   * Mutates `survivors` in place. Returns the new total.
   */
  private dropAbandonedPartitions(survivors: string[], total: number): number {
    for (let index = survivors.length - 1; index >= 0 && total > this.maxStoreSize; index--) {
      const partition = survivors[index];
      if (this.partitions.isLive(partition)) {
        continue;
      }
      total -= this.partitions.sizeOf(partition);
      this.partitions.remove(partition);
      survivors.splice(index, 1);
    }
    return total;
  }

  /**
   * Last resort: deletes individual reclaimable files across the surviving partitions,
   * oldest first, until the store fits. Live `.jsonl` files are excluded — only rotated
   * generations and completed trace files are candidates.
   */
  private trimFiles(survivors: string[], startingTotal: number): void {
    const candidates = survivors.flatMap(partition => this.reclaimableFiles(partition));
    candidates.sort((a, b) => a.mtime - b.mtime);

    let total = startingTotal;
    let prunedCurrentPartition = false;

    for (const candidate of candidates) {
      if (total <= this.maxStoreSize) {
        break;
      }
      try {
        fs.rmSync(candidate.filePath, {force: true});
        total -= candidate.size;
        prunedCurrentPartition = prunedCurrentPartition || candidate.partition === this.partitions.currentPartitionId;
      } catch {
        // Skip what we cannot delete.
      }
    }

    if (prunedCurrentPartition) {
      for (const listener of this.invalidationListeners) {
        listener();
      }
    }
  }

  private reclaimableFiles(partition: string): {filePath: string; partition: string; size: number; mtime: number}[] {
    const paths = this.partitions.paths;
    const files: string[] = [
      ...RotatingJsonlWriter.rotatedFiles(paths.logsFile(partition), this.maxLogFiles),
      ...RotatingJsonlWriter.rotatedFiles(paths.requestsFile(partition), this.maxLogFiles),
      ...this.traceFiles(paths.tracesDirectory(partition)),
    ];

    return files.flatMap(filePath => {
      try {
        const stats = fs.statSync(filePath);
        return [{filePath, partition, size: stats.size, mtime: stats.mtimeMs}];
      } catch {
        return [];
      }
    });
  }

  private traceFiles(tracesDirectory: string): string[] {
    try {
      return fs.readdirSync(tracesDirectory, {withFileTypes: true})
        .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
        .map(entry => path.join(tracesDirectory, entry.name));
    } catch {
      return [];
    }
  }

  private sweepInterval(): number {
    if (this.maxStoreSize <= 0) {
      return StoreBudgetEnforcer.MINIMUM_SWEEP_INTERVAL;
    }
    return Math.max(this.maxStoreSize * StoreBudgetEnforcer.SWEEP_FRACTION, StoreBudgetEnforcer.MINIMUM_SWEEP_INTERVAL);
  }
}
