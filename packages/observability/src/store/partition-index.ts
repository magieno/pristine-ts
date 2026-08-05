import * as fs from "fs";
import * as path from "path";
import {inject, injectable, singleton} from "tsyringe";
import {injectConfig, InternalContainerParameterEnum, moduleScoped} from "@pristine-ts/common";
import {ObservabilityModuleKeyname} from "../observability.module.keyname";
import {ObservabilityConfigurationKeys} from "../observability.configuration-keys";
import {ObservabilityPaths} from "../paths/observability-paths";

/**
 * Everything the store knows about the *set* of partition directories under the store
 * root: which exist, how old they are, how big they are, and which are still owned by a
 * running process.
 *
 * Both `LogStore` and `TraceStore` used to carry their own copy of this logic (identical
 * `partitionsNewestFirst` / `directoryMtime` pairs); it lives here once so retention can
 * reason about the whole store rather than about one writer's view of it.
 *
 * Singleton: the pid claim must happen once per process, and both stores share the
 * resolved paths.
 */
@moduleScoped(ObservabilityModuleKeyname)
@singleton()
@injectable()
export class PartitionIndex {
  /**
   * The resolved path helper for the configured store root.
   */
  public readonly paths: ObservabilityPaths;

  private claimed = false;

  constructor(
    @injectConfig(ObservabilityConfigurationKeys.Directory) directory: string,
    @inject(InternalContainerParameterEnum.KernelInstantiationId) public readonly currentPartitionId: string,
  ) {
    this.paths = new ObservabilityPaths(directory);
  }

  /**
   * Partition directory names, most-recently-written first. Missing or unreadable roots
   * read as empty.
   */
  newestFirst(): string[] {
    try {
      return fs.readdirSync(this.paths.root, {withFileTypes: true})
        .filter(entry => entry.isDirectory())
        .map(entry => ({name: entry.name, mtime: this.mtimeOf(entry.name)}))
        .sort((a, b) => b.mtime - a.mtime)
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  /**
   * The partition's last-write time in epoch milliseconds, or `0` when it cannot be read.
   */
  mtimeOf(partition: string): number {
    try {
      return fs.statSync(this.paths.instanceDirectory(partition)).mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Total bytes occupied by a partition, walking its `traces/` subdirectory. Used by the
   * store-wide budget; `0` for anything unreadable.
   */
  sizeOf(partition: string): number {
    return this.directorySize(this.paths.instanceDirectory(partition));
  }

  /**
   * Records this process as the owner of its partition directory. Called once, right
   * after the directory is created, so retention running in *another* process can tell a
   * live partition from an abandoned one.
   */
  claim(): void {
    if (this.claimed) {
      return;
    }
    this.claimed = true;
    try {
      fs.writeFileSync(this.paths.pidFile(this.currentPartitionId), `${process.pid}`, "utf8");
    } catch {
      // Best-effort: without the pid file the partition simply looks abandoned to other
      // processes, which is the pre-existing behaviour.
    }
  }

  /**
   * Whether a partition is still being written to. The current process's own partition
   * always is. For others, the `pid` sidecar is checked with a signal-0 probe.
   *
   * Pid reuse can, in principle, make an abandoned partition look live — the cost of a
   * false positive is one extra directory kept until the byte budget reclaims it, which
   * is strictly better than deleting a running process's logs.
   */
  isLive(partition: string): boolean {
    if (partition === this.currentPartitionId) {
      return true;
    }
    try {
      const pid = Number.parseInt(fs.readFileSync(this.paths.pidFile(partition), "utf8").trim(), 10);
      if (Number.isNaN(pid) || pid <= 0) {
        return false;
      }
      // Signal 0 performs the permission/existence check without delivering a signal.
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Removes a partition directory entirely. Best-effort.
   */
  remove(partition: string): void {
    try {
      fs.rmSync(this.paths.instanceDirectory(partition), {recursive: true, force: true});
    } catch {
      // Best-effort.
    }
  }

  private directorySize(directory: string): number {
    let total = 0;
    try {
      for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          total += this.directorySize(entryPath);
          continue;
        }
        try {
          total += fs.statSync(entryPath).size;
        } catch {
          // Vanished mid-walk (another process pruning) — count it as zero.
        }
      }
    } catch {
      return total;
    }
    return total;
  }
}
