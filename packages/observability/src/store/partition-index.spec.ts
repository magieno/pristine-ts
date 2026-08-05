import "reflect-metadata";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {PartitionIndex} from "./partition-index";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-index-"));
}

const tick = () => new Promise(resolve => setTimeout(resolve, 20));

describe("PartitionIndex", () => {
  it("lists partitions newest-first and ignores loose files", async () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");

    for (const name of ["a", "b", "c"]) {
      fs.mkdirSync(path.join(directory, name));
      await tick();
    }
    fs.writeFileSync(path.join(directory, "stray.txt"), "not a partition");

    expect(index.newestFirst()).toEqual(["c", "b", "a"]);
  });

  it("reads an empty list for a store root that does not exist yet", () => {
    const index = new PartitionIndex(path.join(makeTempDir(), "not-created"), "current");

    expect(index.newestFirst()).toEqual([]);
  });

  it("sums a partition's bytes, traces included", () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");
    fs.mkdirSync(index.paths.tracesDirectory("current"), {recursive: true});
    fs.writeFileSync(index.paths.logsFile("current"), "x".repeat(100));
    fs.writeFileSync(index.paths.traceFile("current", "t1"), "y".repeat(50));

    expect(index.sizeOf("current")).toBe(150);
  });

  it("claims its own partition once, recording the pid", () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");
    fs.mkdirSync(index.paths.instanceDirectory("current"), {recursive: true});

    index.claim();
    expect(fs.readFileSync(index.paths.pidFile("current"), "utf8")).toBe(`${process.pid}`);

    // A second call is a no-op — the file is not rewritten.
    fs.writeFileSync(index.paths.pidFile("current"), "tampered");
    index.claim();
    expect(fs.readFileSync(index.paths.pidFile("current"), "utf8")).toBe("tampered");
  });

  it("treats its own partition as live regardless of the pid file", () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");

    expect(index.isLive("current")).toBe(true);
  });

  it("treats a partition with a running pid as live and one without as abandoned", () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");

    fs.mkdirSync(index.paths.instanceDirectory("live"), {recursive: true});
    fs.writeFileSync(index.paths.pidFile("live"), `${process.pid}`);

    fs.mkdirSync(index.paths.instanceDirectory("no-pid-file"), {recursive: true});

    fs.mkdirSync(index.paths.instanceDirectory("garbage-pid"), {recursive: true});
    fs.writeFileSync(index.paths.pidFile("garbage-pid"), "not-a-number");

    expect(index.isLive("live")).toBe(true);
    expect(index.isLive("no-pid-file")).toBe(false);
    expect(index.isLive("garbage-pid")).toBe(false);
  });

  it("removes a partition directory recursively", () => {
    const directory = makeTempDir();
    const index = new PartitionIndex(directory, "current");
    fs.mkdirSync(index.paths.tracesDirectory("doomed"), {recursive: true});
    fs.writeFileSync(index.paths.traceFile("doomed", "t1"), "{}");

    index.remove("doomed");

    expect(fs.existsSync(index.paths.instanceDirectory("doomed"))).toBe(false);
  });
});
