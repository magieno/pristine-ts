import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {TraceFileRetention} from "./trace-file-retention";

function makeTracesDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-traces-"));
  fs.mkdirSync(path.join(directory, "traces"));
  return path.join(directory, "traces");
}

function write(directory: string, name: string, content = "{}"): string {
  const filePath = path.join(directory, name);
  fs.writeFileSync(filePath, content);
  return name;
}

describe("TraceFileRetention", () => {
  it("evicts the oldest files past the cap", () => {
    const directory = makeTracesDirectory();
    const retention = new TraceFileRetention(directory, 2);

    for (const name of ["a.json", "b.json", "c.json", "d.json"]) {
      write(directory, name);
      retention.register(name);
    }

    expect(fs.readdirSync(directory).sort()).toEqual(["c.json", "d.json"]);
  });

  it("counts files inherited from a previous run", async () => {
    const directory = makeTracesDirectory();
    write(directory, "old-1.json");
    await new Promise(resolve => setTimeout(resolve, 20));
    write(directory, "old-2.json");
    await new Promise(resolve => setTimeout(resolve, 20));

    const retention = new TraceFileRetention(directory, 2);
    write(directory, "new.json");
    retention.register("new.json");

    expect(fs.readdirSync(directory).sort()).toEqual(["new.json", "old-2.json"]);
  });

  it("refreshes rather than double-counts a rewritten trace", () => {
    const directory = makeTracesDirectory();
    const retention = new TraceFileRetention(directory, 2);

    write(directory, "a.json");
    retention.register("a.json");
    write(directory, "a.json");
    retention.register("a.json");
    write(directory, "b.json");
    retention.register("b.json");

    expect(fs.readdirSync(directory).sort()).toEqual(["a.json", "b.json"]);
  });

  it("reports the bytes it frees", () => {
    const directory = makeTracesDirectory();
    const freed: number[] = [];
    const retention = new TraceFileRetention(directory, 1, bytes => freed.push(bytes));

    write(directory, "a.json", "x".repeat(50));
    retention.register("a.json");
    write(directory, "b.json", "y".repeat(10));
    retention.register("b.json");

    expect(freed).toEqual([50]);
  });

  it("re-reads the directory after invalidate()", () => {
    const directory = makeTracesDirectory();
    const retention = new TraceFileRetention(directory, 3);

    for (const name of ["a.json", "b.json", "c.json"]) {
      write(directory, name);
      retention.register(name);
    }

    // Something else (the store-wide sweep) deleted files behind our back.
    fs.rmSync(path.join(directory, "a.json"));
    fs.rmSync(path.join(directory, "b.json"));
    retention.invalidate();

    write(directory, "d.json");
    retention.register("d.json");
    write(directory, "e.json");
    retention.register("e.json");

    // Without the invalidation the stale FIFO would have evicted `c.json` here.
    expect(fs.readdirSync(directory).sort()).toEqual(["c.json", "d.json", "e.json"]);
  });

  it("treats a cap below 1 as 1", () => {
    const directory = makeTracesDirectory();
    const retention = new TraceFileRetention(directory, 0);

    write(directory, "a.json");
    retention.register("a.json");
    write(directory, "b.json");
    retention.register("b.json");

    expect(fs.readdirSync(directory)).toEqual(["b.json"]);
  });
});
