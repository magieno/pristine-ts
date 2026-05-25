import * as fs from "fs";
import * as path from "path";

/**
 * Follows a growing `.jsonl` file and emits each newly-appended complete line. The
 * `logs --follow` command and the REPL use this for a `tail -f`-style live view.
 *
 * Watches the file's parent directory (watching a not-yet-created file directly is
 * unreliable across platforms) and reads the byte delta on each change. Partial trailing
 * lines are buffered until their terminating newline arrives.
 *
 * Not a DI service — a plain utility. Instantiate, `follow()`, and `stop()` when done.
 */
export class LogTailer {
  private watcher?: fs.FSWatcher;
  private offset = 0;
  private buffer = "";

  constructor(private readonly filePath: string) {
  }

  /**
   * Starts following. Existing content is skipped — only lines appended after this call
   * are emitted. Call `stop()` to release the watch.
   */
  follow(onLine: (line: string) => void): void {
    this.offset = fs.existsSync(this.filePath) ? fs.statSync(this.filePath).size : 0;

    const directory = path.dirname(this.filePath);
    const filename = path.basename(this.filePath);

    this.watcher = fs.watch(directory, (_eventType, changed) => {
      if (changed !== null && changed !== filename) {
        return;
      }
      this.drain(onLine);
    });
  }

  /**
   * Stops following and releases the filesystem watch.
   */
  stop(): void {
    this.watcher?.close();
    this.watcher = undefined;
  }

  private drain(onLine: (line: string) => void): void {
    if (fs.existsSync(this.filePath) === false) {
      return;
    }

    const size = fs.statSync(this.filePath).size;
    if (size <= this.offset) {
      // Truncated or unchanged — reset to the new end so we don't replay stale bytes.
      this.offset = size;
      return;
    }

    const fd = fs.openSync(this.filePath, "r");
    try {
      const length = size - this.offset;
      const chunk = Buffer.alloc(length);
      fs.readSync(fd, chunk, 0, length, this.offset);
      this.offset = size;
      this.buffer += chunk.toString("utf8");
    } finally {
      fs.closeSync(fd);
    }

    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.length > 0) {
        onLine(line);
      }
    }
  }
}
