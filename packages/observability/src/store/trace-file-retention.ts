import * as fs from "fs";
import * as path from "path";

/**
 * Caps how many `traces/<eventId>.json` files a single partition keeps. Traces are one
 * file per request, so a busy server exhausts directory entries (and inodes) long before
 * any byte quota would notice — rotation on the `.jsonl` files alone does not bound this.
 *
 * Keeps an in-memory FIFO of the trace files written by this process, seeded once from
 * the directory listing (ordered by `mtime`) so a restart into an existing partition
 * still sees the files it inherited. Deleting the oldest entry costs one `unlink`.
 *
 * Not a DI service — `TraceStore` owns one instance for its own partition.
 */
export class TraceFileRetention {
  private files?: string[];

  /**
   * @param tracesDirectory The partition's `traces/` directory.
   * @param maxTraceFiles How many trace files to keep. Values below 1 are treated as 1.
   * @param onDelete Called with the freed byte count after each deletion, so the store-wide budget can be kept in sync.
   */
  constructor(
    private readonly tracesDirectory: string,
    private readonly maxTraceFiles: number,
    private readonly onDelete?: (bytes: number) => void,
  ) {
  }

  /**
   * Records a freshly-written trace file and evicts the oldest ones beyond the cap.
   * Best-effort: a failed eviction never blocks the write that triggered it.
   */
  register(fileName: string): void {
    if (this.files === undefined) {
      this.files = this.listExisting();
    }

    const index = this.files.indexOf(fileName);
    if (index !== -1) {
      // Rewriting an existing trace (same event id) refreshes its position rather than
      // double-counting it.
      this.files.splice(index, 1);
    }
    this.files.push(fileName);

    const limit = Math.max(this.maxTraceFiles, 1);
    while (this.files.length > limit) {
      const stale = this.files.shift();
      if (stale !== undefined) {
        this.delete(stale);
      }
    }
  }

  /**
   * Forgets the cached listing. Used when something outside this class removed files
   * (store-wide budget enforcement), so the next `register` re-reads the truth.
   */
  invalidate(): void {
    this.files = undefined;
  }

  private listExisting(): string[] {
    try {
      return fs.readdirSync(this.tracesDirectory, {withFileTypes: true})
        .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
        .map(entry => ({name: entry.name, mtime: this.mtimeOf(entry.name)}))
        .sort((a, b) => a.mtime - b.mtime)
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  private mtimeOf(fileName: string): number {
    try {
      return fs.statSync(path.join(this.tracesDirectory, fileName)).mtimeMs;
    } catch {
      return 0;
    }
  }

  private delete(fileName: string): void {
    const filePath = path.join(this.tracesDirectory, fileName);
    try {
      const bytes = fs.statSync(filePath).size;
      fs.rmSync(filePath, {force: true});
      this.onDelete?.(bytes);
    } catch {
      // Best-effort.
    }
  }
}
