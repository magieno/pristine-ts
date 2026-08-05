import * as fs from "fs";

/**
 * Reads `.jsonl` files in bounded chunks instead of slurping them whole. The store's
 * files are capped by rotation, but a capped file is still tens of megabytes — reading
 * one with `fs.readFileSync(...).split("\n")` costs the file size in string memory plus
 * an array of every line, which is what used to make `pristine logs` fall over on a
 * long-lived store.
 *
 * Both directions stop as soon as the caller says so: return `false` from the callback
 * and the remaining bytes are never read. That is what makes `--limit` cheap — a limit
 * of 100 on a 10 MB file touches one 64 KB chunk.
 *
 * Chunk boundaries are handled at the **byte** level: the carry between iterations is a
 * `Buffer`, and decoding only ever happens on a region that ends at a newline (`0x0A`
 * can never be part of a multi-byte UTF-8 sequence), so a character split across two
 * reads is never mangled.
 *
 * Not a DI service — a stateless utility, all methods static.
 */
export class JsonlReader {
  private static readonly CHUNK_SIZE = 64 * 1024;
  private static readonly NEWLINE = 0x0a;

  /**
   * Invokes `onLine` for each non-empty line, oldest first. Returning `false` stops the
   * read. Missing or unreadable files are treated as empty.
   */
  static forEachLine(filePath: string, onLine: (line: string) => boolean | void): void {
    JsonlReader.withFile(filePath, (handle, size) => {
      const chunk = Buffer.alloc(JsonlReader.CHUNK_SIZE);
      let carry = Buffer.alloc(0);
      let offset = 0;

      while (offset < size) {
        const read = fs.readSync(handle, chunk, 0, Math.min(JsonlReader.CHUNK_SIZE, size - offset), offset);
        if (read <= 0) {
          break;
        }
        offset += read;

        const combined = Buffer.concat([carry, chunk.subarray(0, read)]);
        const breaks = JsonlReader.newlineIndexes(combined);
        let start = 0;
        for (const index of breaks) {
          if (JsonlReader.emit(combined, start, index, onLine) === false) {
            return;
          }
          start = index + 1;
        }
        // Whatever follows the last newline is an incomplete line — carry the raw bytes.
        carry = Buffer.from(combined.subarray(start));
      }

      JsonlReader.emit(carry, 0, carry.length, onLine);
    });
  }

  /**
   * Invokes `onLine` for each non-empty line, **newest first**. Returning `false` stops
   * the read, so "the last N entries of a huge file" costs only the chunks that hold
   * them. Missing or unreadable files are treated as empty.
   */
  static forEachLineReverse(filePath: string, onLine: (line: string) => boolean | void): void {
    JsonlReader.withFile(filePath, (handle, size) => {
      const chunk = Buffer.alloc(JsonlReader.CHUNK_SIZE);
      let carry = Buffer.alloc(0);
      let remaining = size;

      while (remaining > 0) {
        const length = Math.min(JsonlReader.CHUNK_SIZE, remaining);
        const start = remaining - length;
        const read = fs.readSync(handle, chunk, 0, length, start);
        if (read <= 0) {
          break;
        }
        remaining = start;

        // `carry` holds the bytes of the region already scanned that belong to a line
        // whose beginning lives in this (earlier) chunk.
        const combined = Buffer.concat([chunk.subarray(0, read), carry]);
        const breaks = JsonlReader.newlineIndexes(combined);

        for (let position = breaks.length - 1; position >= 0; position--) {
          const lineStart = breaks[position] + 1;
          const lineEnd = position + 1 < breaks.length ? breaks[position + 1] : combined.length;
          if (JsonlReader.emit(combined, lineStart, lineEnd, onLine) === false) {
            return;
          }
        }

        // Everything before the first newline continues into the previous chunk.
        carry = Buffer.from(combined.subarray(0, breaks.length > 0 ? breaks[0] : combined.length));
      }

      // Reached the start of the file: the carry is the file's first line.
      JsonlReader.emit(carry, 0, carry.length, onLine);
    });
  }

  /**
   * Parses each line as JSON, skipping malformed ones. `limit` caps how many *parsed*
   * entries are collected; `newestFirst` reads from the end of the file so the limit
   * keeps the newest entries. The returned array is always in file order (oldest first),
   * regardless of the read direction.
   */
  static parse<T>(filePath: string, options: {limit?: number; newestFirst?: boolean} = {}): T[] {
    const entries: T[] = [];
    const limit = options.limit;

    const collect = (line: string): boolean | void => {
      try {
        entries.push(JSON.parse(line) as T);
      } catch {
        // Skip malformed lines rather than aborting the read.
        return;
      }
      if (limit !== undefined && entries.length >= limit) {
        return false;
      }
    };

    if (options.newestFirst === true) {
      JsonlReader.forEachLineReverse(filePath, collect);
      return entries.reverse();
    }

    JsonlReader.forEachLine(filePath, collect);
    return entries;
  }

  /**
   * Opens the file, hands the descriptor and its size to `body`, and always closes.
   * A missing or unreadable file is a no-op — same contract the stores had when they
   * swallowed `readFileSync` failures.
   */
  private static withFile(filePath: string, body: (handle: number, size: number) => void): void {
    let handle: number | undefined;
    try {
      handle = fs.openSync(filePath, "r");
      body(handle, fs.fstatSync(handle).size);
    } catch {
      // Treated as empty.
    } finally {
      if (handle !== undefined) {
        try {
          fs.closeSync(handle);
        } catch {
          // Nothing useful to do if the descriptor is already gone.
        }
      }
    }
  }

  private static newlineIndexes(buffer: Buffer): number[] {
    const indexes: number[] = [];
    for (let index = 0; index < buffer.length; index++) {
      if (buffer[index] === JsonlReader.NEWLINE) {
        indexes.push(index);
      }
    }
    return indexes;
  }

  /**
   * Decodes `[start, end)` and emits it when it is not blank. Returns `false` only when
   * the callback asked to stop.
   */
  private static emit(buffer: Buffer, start: number, end: number, onLine: (line: string) => boolean | void): boolean | void {
    if (end <= start) {
      return;
    }
    const line = buffer.toString("utf8", start, end);
    if (line.trim().length === 0) {
      return;
    }
    return onLine(line);
  }
}
