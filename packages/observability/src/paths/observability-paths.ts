import * as path from "path";

/**
 * Resolves every path inside the observability store from the configured store directory.
 * Pure and stateless past construction — instantiate once with the configured directory
 * and reuse.
 *
 * Layout:
 * ```
 * <root>/
 *   <instanceId>/logs.jsonl
 *   <instanceId>/logs.1.jsonl        <- rotated generations, 1 = most recent
 *   <instanceId>/requests.jsonl
 *   <instanceId>/requests.1.jsonl
 *   <instanceId>/traces/<traceId>.json
 *   <instanceId>/pid                 <- the owning process, so retention spares live partitions
 * ```
 *
 * Each `<instanceId>` is one pristine process lifetime (= the kernel instantiation id).
 * No metadata sidecars, no `latest.json` pointer — directory `mtime` answers "which is
 * most recent."
 */
export class ObservabilityPaths {
  /**
   * The absolute store root. The configured directory is resolved against `process.cwd()`
   * when it is not already absolute.
   */
  public readonly root: string;

  constructor(configuredDirectory: string) {
    this.root = path.isAbsolute(configuredDirectory)
      ? configuredDirectory
      : path.resolve(process.cwd(), configuredDirectory);
  }

  instanceDirectory(instanceId: string): string {
    return path.join(this.root, instanceId);
  }

  logsFile(instanceId: string): string {
    return path.join(this.instanceDirectory(instanceId), "logs.jsonl");
  }

  requestsFile(instanceId: string): string {
    return path.join(this.instanceDirectory(instanceId), "requests.jsonl");
  }

  tracesDirectory(instanceId: string): string {
    return path.join(this.instanceDirectory(instanceId), "traces");
  }

  traceFile(instanceId: string, traceId: string): string {
    return path.join(this.tracesDirectory(instanceId), `${traceId}.json`);
  }

  /**
   * The file recording which OS process owns an instance directory. Retention reads it
   * to avoid deleting a partition that a concurrently-running process is still writing
   * to (multiple workers, `cluster`, a process manager running several apps).
   */
  pidFile(instanceId: string): string {
    return path.join(this.instanceDirectory(instanceId), "pid");
  }

  /**
   * The name of a rotated generation of a `.jsonl` file: `logs.jsonl` → `logs.1.jsonl`.
   * Generation 1 is the most recently rotated; higher numbers are older. Generation 0
   * is the live file itself.
   *
   * Static because rotation names are derived from a file path rather than from the
   * store root — both the writer and the readers need them.
   */
  static rotated(filePath: string, generation: number): string {
    if (generation <= 0) {
      return filePath;
    }
    const extension = path.extname(filePath);
    const base = filePath.slice(0, filePath.length - extension.length);
    return `${base}.${generation}${extension}`;
  }
}
