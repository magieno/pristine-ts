import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {JsonlReader} from "./jsonl-reader";

function writeLines(lines: string[]): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-reader-"));
  const filePath = path.join(directory, "data.jsonl");
  fs.writeFileSync(filePath, lines.map(line => `${line}\n`).join(""));
  return filePath;
}

describe("JsonlReader", () => {
  it("reads every line oldest-first", () => {
    const filePath = writeLines(["a", "b", "c"]);
    const seen: string[] = [];

    JsonlReader.forEachLine(filePath, line => {
      seen.push(line);
    });

    expect(seen).toEqual(["a", "b", "c"]);
  });

  it("reads every line newest-first", () => {
    const filePath = writeLines(["a", "b", "c"]);
    const seen: string[] = [];

    JsonlReader.forEachLineReverse(filePath, line => {
      seen.push(line);
    });

    expect(seen).toEqual(["c", "b", "a"]);
  });

  it("stops as soon as the callback returns false", () => {
    const filePath = writeLines(["a", "b", "c", "d"]);
    const seen: string[] = [];

    JsonlReader.forEachLineReverse(filePath, line => {
      seen.push(line);
      return seen.length < 2;
    });

    expect(seen).toEqual(["d", "c"]);
  });

  it("handles a file with no trailing newline", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-reader-"));
    const filePath = path.join(directory, "data.jsonl");
    fs.writeFileSync(filePath, "a\nb\nc");

    const forward: string[] = [];
    JsonlReader.forEachLine(filePath, line => {
      forward.push(line);
    });
    const backward: string[] = [];
    JsonlReader.forEachLineReverse(filePath, line => {
      backward.push(line);
    });

    expect(forward).toEqual(["a", "b", "c"]);
    expect(backward).toEqual(["c", "b", "a"]);
  });

  it("treats a missing file as empty", () => {
    const seen: string[] = [];

    JsonlReader.forEachLine("/definitely/not/here.jsonl", line => {
      seen.push(line);
    });
    JsonlReader.forEachLineReverse("/definitely/not/here.jsonl", line => {
      seen.push(line);
    });

    expect(seen).toEqual([]);
  });

  it("survives chunk boundaries in both directions, including multi-byte characters", () => {
    // Each line is deliberately long enough that the 64 KB chunking splits the file
    // mid-line — and mid-character, since the payload is multi-byte.
    const lines = Array.from({length: 40}, (_, index) => `${index}:${"é".repeat(3_000)}`);
    const filePath = writeLines(lines);

    const forward: string[] = [];
    JsonlReader.forEachLine(filePath, line => {
      forward.push(line);
    });
    const backward: string[] = [];
    JsonlReader.forEachLineReverse(filePath, line => {
      backward.push(line);
    });

    expect(forward).toEqual(lines);
    expect(backward).toEqual([...lines].reverse());
    expect(forward.join("")).not.toContain("�");
    expect(backward.join("")).not.toContain("�");
  });

  it("parse() keeps the newest entries when limited, in file order", () => {
    const filePath = writeLines([1, 2, 3, 4, 5].map(value => JSON.stringify({value})));

    expect(JsonlReader.parse<{value: number}>(filePath, {limit: 2, newestFirst: true}).map(entry => entry.value))
      .toEqual([4, 5]);
    expect(JsonlReader.parse<{value: number}>(filePath, {limit: 2}).map(entry => entry.value))
      .toEqual([1, 2]);
  });

  it("parse() skips malformed lines", () => {
    const filePath = writeLines(['{"value":1}', "not json", '{"value":2}']);

    expect(JsonlReader.parse<{value: number}>(filePath).map(entry => entry.value)).toEqual([1, 2]);
  });
});
