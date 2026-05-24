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
 *   <instanceId>/requests.jsonl
 *   <instanceId>/traces/<traceId>.json
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
}
