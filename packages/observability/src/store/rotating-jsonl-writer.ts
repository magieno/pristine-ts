import * as fs from "fs";
import {ObservabilityPaths} from "../paths/observability-paths";

/**
 * Appends lines to a `.jsonl` file, rolling it over once it would exceed `maxFileSize`
 * and keeping at most `maxFiles` generations (the live file plus `maxFiles - 1` rotated
 * ones). This is what bounds a *single* process's footprint: without it a long-running
 * server appends to one `logs.jsonl` for its entire lifetime, since instance-directory
 * retention only ever prunes *other* processes' directories.
 *
 * Rotation is a rename chain — `logs.2.jsonl` is dropped, `logs.1.jsonl` becomes
 * `logs.2.jsonl`, and the live `logs.jsonl` becomes `logs.1.jsonl`. Readers pick the
 * generations up through {@link existingFiles}; `LogTailer` already resets its offset
 * when the file it follows shrinks, so `logs --follow` survives a rollover.
 *
 * The current size is tracked in memory (seeded from the file on first append) so the
 * common path costs one `appendFileSync` and no `stat`.
 *
 * Not a DI service — the stores own one instance per file they write.
 */
export class RotatingJsonlWriter {
  private size?: number;

  /**
   * @param filePath The live file. Rotated generations sit beside it.
   * @param maxFileSize Byte ceiling for the live file. A line that would cross it triggers a rollover first.
   * @param maxFiles Total generations kept, live file included. `1` means "never keep a rotated copy" — the file is simply restarted.
   * @param onWrite Called after every successful append with the bytes written and whether this append rotated. The stores use it to feed the store-wide budget.
   */
  constructor(
    private readonly filePath: string,
    private readonly maxFileSize: number,
    private readonly maxFiles: number,
    private readonly onWrite?: (bytes: number, rotated: boolean) => void,
  ) {
  }

  /**
   * Appends one already-serialized line. The trailing newline is added here so callers
   * cannot forget it — and so the byte accounting matches what lands on disk.
   */
  append(line: string): void {
    const payload = line.endsWith("\n") ? line : `${line}\n`;
    const bytes = Buffer.byteLength(payload);

    if (this.size === undefined) {
      this.size = RotatingJsonlWriter.sizeOf(this.filePath);
    }

    // Rotate *before* writing, and never on an empty file: an oversized single line
    // still gets written (truncating it is the entry-size guard's job, not ours) and
    // simply triggers the rollover on the next append.
    let rotated = false;
    if (this.size > 0 && this.size + bytes > this.maxFileSize) {
      this.rotate();
      rotated = true;
    }

    fs.appendFileSync(this.filePath, payload);
    this.size += bytes;
    this.onWrite?.(bytes, rotated);
  }

  /**
   * Every existing generation of `filePath`, **oldest first** — `logs.3.jsonl`,
   * `logs.2.jsonl`, `logs.1.jsonl`, `logs.jsonl`. Readers walk this to reconstruct the
   * full write order of a partition across rollovers.
   */
  static existingFiles(filePath: string, maxFiles: number): string[] {
    const files: string[] = [];
    for (let generation = Math.max(maxFiles, 1) - 1; generation >= 0; generation--) {
      const candidate = ObservabilityPaths.rotated(filePath, generation);
      if (fs.existsSync(candidate)) {
        files.push(candidate);
      }
    }
    return files;
  }

  /**
   * The rotated generations only (no live file), **oldest first**. Store-wide retention
   * deletes from this list when it needs to reclaim space inside a partition that is
   * still being written to — a rotated file is closed and safe to remove, the live one
   * is not.
   */
  static rotatedFiles(filePath: string, maxFiles: number): string[] {
    return RotatingJsonlWriter.existingFiles(filePath, maxFiles).filter(file => file !== filePath);
  }

  /**
   * Drops the oldest generation and shifts every other one up by one, freeing the live
   * name. Best-effort per step: a rename that fails (a reader holding the file open on
   * Windows, say) must not stop the append that triggered it.
   */
  private rotate(): void {
    if (this.maxFiles <= 1) {
      // No generations kept — restart the live file in place.
      this.remove(this.filePath);
      this.size = 0;
      return;
    }

    this.remove(ObservabilityPaths.rotated(this.filePath, this.maxFiles - 1));
    for (let generation = this.maxFiles - 2; generation >= 1; generation--) {
      this.rename(
        ObservabilityPaths.rotated(this.filePath, generation),
        ObservabilityPaths.rotated(this.filePath, generation + 1),
      );
    }
    this.rename(this.filePath, ObservabilityPaths.rotated(this.filePath, 1));
    this.size = 0;
  }

  private remove(filePath: string): void {
    try {
      fs.rmSync(filePath, {force: true});
    } catch {
      // Best-effort.
    }
  }

  private rename(from: string, to: string): void {
    try {
      if (fs.existsSync(from)) {
        fs.renameSync(from, to);
      }
    } catch {
      // Best-effort.
    }
  }

  private static sizeOf(filePath: string): number {
    try {
      return fs.statSync(filePath).size;
    } catch {
      return 0;
    }
  }
}
