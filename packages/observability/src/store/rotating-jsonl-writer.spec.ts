import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {RotatingJsonlWriter} from "./rotating-jsonl-writer";
import {ObservabilityPaths} from "../paths/observability-paths";

function makeFilePath(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "pristine-obs-writer-")), "logs.jsonl");
}

function contentOf(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

describe("RotatingJsonlWriter", () => {
  it("appends lines with a trailing newline", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 1_000, 3);

    writer.append("first");
    writer.append("second\n"); // already terminated — must not double up

    expect(contentOf(filePath)).toBe("first\nsecond\n");
  });

  it("rotates before the live file would exceed maxFileSize", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 20, 3);

    writer.append("0123456789"); // 11 bytes
    writer.append("0123456789"); // would be 22 > 20 → rotate first

    expect(contentOf(ObservabilityPaths.rotated(filePath, 1))).toBe("0123456789\n");
    expect(contentOf(filePath)).toBe("0123456789\n");
  });

  it("keeps at most maxFiles generations", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 20, 3);

    for (let index = 0; index < 10; index++) {
      writer.append(`line-${index}-padding`);
    }

    expect(fs.existsSync(ObservabilityPaths.rotated(filePath, 1))).toBe(true);
    expect(fs.existsSync(ObservabilityPaths.rotated(filePath, 2))).toBe(true);
    expect(fs.existsSync(ObservabilityPaths.rotated(filePath, 3))).toBe(false);
  });

  it("restarts the live file in place when no generations are kept", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 20, 1);

    writer.append("0123456789");
    writer.append("abcdefghij");

    expect(contentOf(filePath)).toBe("abcdefghij\n");
    expect(fs.existsSync(ObservabilityPaths.rotated(filePath, 1))).toBe(false);
  });

  it("writes an oversized single line rather than dropping it", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 10, 3);

    writer.append("x".repeat(100));

    expect(contentOf(filePath)).toBe(`${"x".repeat(100)}\n`);
  });

  it("reports written bytes and rotations to the callback", () => {
    const filePath = makeFilePath();
    const events: {bytes: number; rotated: boolean}[] = [];
    const writer = new RotatingJsonlWriter(filePath, 20, 3, (bytes, rotated) => events.push({bytes, rotated}));

    writer.append("0123456789");
    writer.append("0123456789");

    expect(events).toEqual([{bytes: 11, rotated: false}, {bytes: 11, rotated: true}]);
  });

  it("picks up the existing file size instead of overwriting a previous run", () => {
    const filePath = makeFilePath();
    fs.writeFileSync(filePath, "pre-existing\n");
    const writer = new RotatingJsonlWriter(filePath, 20, 3);

    writer.append("appended");

    expect(contentOf(ObservabilityPaths.rotated(filePath, 1))).toBe("pre-existing\n");
    expect(contentOf(filePath)).toBe("appended\n");
  });

  it("enumerates existing generations oldest-first, live file last", () => {
    const filePath = makeFilePath();
    const writer = new RotatingJsonlWriter(filePath, 20, 3);

    for (let index = 0; index < 6; index++) {
      writer.append(`line-${index}-padding`);
    }

    expect(RotatingJsonlWriter.existingFiles(filePath, 3)).toEqual([
      ObservabilityPaths.rotated(filePath, 2),
      ObservabilityPaths.rotated(filePath, 1),
      filePath,
    ]);
    expect(RotatingJsonlWriter.rotatedFiles(filePath, 3)).toEqual([
      ObservabilityPaths.rotated(filePath, 2),
      ObservabilityPaths.rotated(filePath, 1),
    ]);
  });
});
