import * as path from "path";

/**
 * Resolves every path inside the observability store from the configured store directory.
 * Pure and stateless past construction — instantiate once with the configured directory
 * and reuse.
 *
 * Layout:
 * ```
 * <root>/
 *   runs/<runId>/run.json
 *   runs/<runId>/logs.jsonl
 *   runs/<runId>/requests.jsonl
 *   runs/<runId>/traces/<traceId>.json
 *   latest.json
 * ```
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

  runsDirectory(): string {
    return path.join(this.root, "runs");
  }

  runDirectory(runId: string): string {
    return path.join(this.runsDirectory(), runId);
  }

  runMetadataFile(runId: string): string {
    return path.join(this.runDirectory(runId), "run.json");
  }

  logsFile(runId: string): string {
    return path.join(this.runDirectory(runId), "logs.jsonl");
  }

  requestsFile(runId: string): string {
    return path.join(this.runDirectory(runId), "requests.jsonl");
  }

  tracesDirectory(runId: string): string {
    return path.join(this.runDirectory(runId), "traces");
  }

  traceFile(runId: string, traceId: string): string {
    return path.join(this.tracesDirectory(runId), `${traceId}.json`);
  }

  latestPointerFile(): string {
    return path.join(this.root, "latest.json");
  }
}
