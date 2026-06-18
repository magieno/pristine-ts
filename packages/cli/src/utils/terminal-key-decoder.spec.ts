import {TerminalKeyDecoder} from "./terminal-key-decoder";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";

describe("TerminalKeyDecoder", () => {
  it("decodes a single printable character", () => {
    expect(TerminalKeyDecoder.decode("a")).toEqual([{name: TerminalKeyName.Character, sequence: "a"}]);
  });

  it("splits a multi-character chunk (paste / fast typing) into one Character key each", () => {
    expect(TerminalKeyDecoder.decode("abc")).toEqual([
      {name: TerminalKeyName.Character, sequence: "a"},
      {name: TerminalKeyName.Character, sequence: "b"},
      {name: TerminalKeyName.Character, sequence: "c"},
    ]);
  });

  it.each([["\r"], ["\n"]])("decodes Enter from %j", (sequence) => {
    expect(TerminalKeyDecoder.decode(sequence)).toEqual([{name: TerminalKeyName.Enter, sequence}]);
  });

  it.each([["\x7f"], ["\b"]])("decodes Backspace from %j", (sequence) => {
    expect(TerminalKeyDecoder.decode(sequence)[0].name).toBe(TerminalKeyName.Backspace);
  });

  it("decodes Ctrl+C", () => {
    expect(TerminalKeyDecoder.decode("\x03")[0].name).toBe(TerminalKeyName.CtrlC);
  });

  it("decodes the up and down arrows", () => {
    expect(TerminalKeyDecoder.decode("\x1b[A")[0].name).toBe(TerminalKeyName.Up);
    expect(TerminalKeyDecoder.decode("\x1b[B")[0].name).toBe(TerminalKeyName.Down);
  });

  it("treats an unrecognized escape sequence as a single Other key", () => {
    expect(TerminalKeyDecoder.decode("\x1b[C")).toEqual([{name: TerminalKeyName.Other, sequence: "\x1b[C"}]);
  });

  it("maps a stray control byte inside a printable run to Other and keeps the rest", () => {
    const keys = TerminalKeyDecoder.decode("a\x01b");
    expect(keys.map((key) => key.name)).toEqual([
      TerminalKeyName.Character,
      TerminalKeyName.Other,
      TerminalKeyName.Character,
    ]);
  });
});
