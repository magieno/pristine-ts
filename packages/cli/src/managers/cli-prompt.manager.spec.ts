import "reflect-metadata";
import {CliPrompt} from "./cli-prompt.manager";
import {TerminalKeyReader} from "./terminal-key-reader.manager";
import {TerminalKey} from "../interfaces/terminal-key.interface";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";

const character = (value: string): TerminalKey => ({name: TerminalKeyName.Character, sequence: value});
const ENTER: TerminalKey = {name: TerminalKeyName.Enter, sequence: "\r"};
const UP: TerminalKey = {name: TerminalKeyName.Up, sequence: "\x1b[A"};
const DOWN: TerminalKey = {name: TerminalKeyName.Down, sequence: "\x1b[B"};
const BACKSPACE: TerminalKey = {name: TerminalKeyName.Backspace, sequence: "\x7f"};

/**
 * Replays a scripted sequence of keys into a `read` handler, resolving as soon as the
 * handler calls its `resolve` callback — the raw-mode reads (`select`, `readSecret`) can be
 * tested without a real TTY by injecting this in place of `TerminalKeyReader`.
 */
class FakeTerminalKeyReader {
  constructor(private readonly keys: TerminalKey[] = []) {
  }

  isInteractive(): boolean {
    return true;
  }

  read<T>(onKey: (key: TerminalKey, resolve: (value: T) => void) => void): Promise<T> {
    return new Promise<T>((resolve) => {
      for (const key of this.keys) {
        let resolved = false;
        onKey(key, (value: T) => {
          resolved = true;
          resolve(value);
        });
        if (resolved) {
          return;
        }
      }
    });
  }
}

const build = (keys: TerminalKey[] = []): CliPrompt =>
  new CliPrompt(new FakeTerminalKeyReader(keys) as unknown as TerminalKeyReader);

describe("CliPrompt", () => {
  beforeEach(() => {
    // Silence (and avoid asserting on) the ANSI redraws the prompts write while running.
    jest.spyOn(process.stdout, "write").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("read delegates to process.stdin.read", () => {
    const prompt = build();
    jest.spyOn(process.stdin, "read").mockReturnValue("buffered" as any);
    expect(prompt.read()).toBe("buffered");
  });

  describe("input", () => {
    it("returns the typed answer, trimmed", async () => {
      const prompt = build();
      jest.spyOn(prompt, "readLine").mockResolvedValue("  src/app.ts  ");
      expect(await prompt.input("Where?", "default.ts")).toBe("src/app.ts");
    });

    it("returns the default when the answer is empty", async () => {
      const prompt = build();
      jest.spyOn(prompt, "readLine").mockResolvedValue("");
      expect(await prompt.input("Where?", "default.ts")).toBe("default.ts");
    });
  });

  describe("confirm", () => {
    it("returns the default on an empty answer", async () => {
      const prompt = build();
      jest.spyOn(prompt, "readLine").mockResolvedValue("");
      expect(await prompt.confirm("Sure?", true)).toBe(true);
      expect(await prompt.confirm("Sure?", false)).toBe(false);
    });

    it("parses yes and no answers", async () => {
      const prompt = build();
      const readLine = jest.spyOn(prompt, "readLine");
      readLine.mockResolvedValueOnce("yes");
      expect(await prompt.confirm("?", false)).toBe(true);
      readLine.mockResolvedValueOnce("n");
      expect(await prompt.confirm("?", true)).toBe(false);
    });

    it("re-asks until a recognized answer is given", async () => {
      const prompt = build();
      const readLine = jest.spyOn(prompt, "readLine")
        .mockResolvedValueOnce("maybe")
        .mockResolvedValueOnce("y");
      expect(await prompt.confirm("?", true)).toBe(true);
      expect(readLine).toHaveBeenCalledTimes(2);
    });
  });

  describe("select", () => {
    const choices = [
      {name: "esm", value: "esm"},
      {name: "cjs", value: "cjs"},
      {name: "both", value: "both"},
    ];

    it("returns the highlighted choice after navigating down", async () => {
      const prompt = build([DOWN, DOWN, ENTER]);
      expect(await prompt.select("Format?", choices, "esm")).toBe("both");
    });

    it("starts the highlight on the default choice", async () => {
      const prompt = build([ENTER]);
      expect(await prompt.select("Format?", choices, "cjs")).toBe("cjs");
    });

    it("wraps around when moving up from the first choice", async () => {
      const prompt = build([UP, ENTER]);
      expect(await prompt.select("Format?", choices, "esm")).toBe("both");
    });

    it("throws when given no choices", async () => {
      const prompt = build();
      await expect(prompt.select("Format?", [])).rejects.toThrow();
    });
  });

  describe("readSecret", () => {
    it("accumulates characters and returns the value on Enter", async () => {
      const prompt = build([character("h"), character("i"), ENTER]);
      expect(await prompt.readSecret("Password? ")).toBe("hi");
    });

    it("erases the last character on Backspace", async () => {
      const prompt = build([character("a"), character("b"), BACKSPACE, character("c"), ENTER]);
      expect(await prompt.readSecret("Password? ")).toBe("ac");
    });

    it("does not trim the secret", async () => {
      const prompt = build([character(" "), character("x"), ENTER]);
      expect(await prompt.readSecret("Password? ")).toBe(" x");
    });
  });
});
