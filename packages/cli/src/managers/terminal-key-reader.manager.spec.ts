import "reflect-metadata";
import {EventEmitter} from "node:events";
import {TerminalKeyReader} from "./terminal-key-reader.manager";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";
import {PromptCancelledError} from "../errors/prompt-cancelled.error";

/**
 * Minimal stand-in for `process.stdin`: an EventEmitter with the TTY/raw-mode surface
 * `TerminalKeyReader` touches, so reads can be driven with synthetic `data` events.
 */
class FakeInput extends EventEmitter {
  isTTY = true;
  isRaw = false;
  setRawMode = jest.fn((mode: boolean) => {
    this.isRaw = mode;
    return this as any;
  });
  resume = jest.fn();
  pause = jest.fn();
}

const buildReader = (): {reader: TerminalKeyReader; fakeInput: FakeInput} => {
  const reader = new TerminalKeyReader();
  const fakeInput = new FakeInput();
  reader.input = fakeInput as any;
  reader.output = {write: jest.fn()} as any;
  return {reader, fakeInput};
};

describe("TerminalKeyReader", () => {
  it("enters raw mode, decodes keys, resolves, then restores raw mode and removes the listener", async () => {
    const {reader, fakeInput} = buildReader();
    const seen: TerminalKeyName[] = [];

    const promise = reader.read<string>((key, resolve) => {
      seen.push(key.name);
      if (key.name === TerminalKeyName.Enter) {
        resolve("done");
      }
    });

    fakeInput.emit("data", Buffer.from("a"));
    fakeInput.emit("data", Buffer.from("\r"));

    await expect(promise).resolves.toBe("done");
    expect(seen).toEqual([TerminalKeyName.Character, TerminalKeyName.Enter]);
    expect(fakeInput.setRawMode).toHaveBeenCalledWith(true);
    expect(fakeInput.setRawMode).toHaveBeenLastCalledWith(false);
    expect(fakeInput.listenerCount("data")).toBe(0);
  });

  it("rejects with PromptCancelledError on Ctrl+C without forwarding it to the handler", async () => {
    const {reader, fakeInput} = buildReader();
    const onKey = jest.fn();

    const promise = reader.read(onKey);
    fakeInput.emit("data", Buffer.from("\x03"));

    await expect(promise).rejects.toBeInstanceOf(PromptCancelledError);
    expect(onKey).not.toHaveBeenCalled();
    expect(fakeInput.setRawMode).toHaveBeenLastCalledWith(false);
  });

  it("restores the terminal's prior raw state rather than a hardcoded false", async () => {
    const {reader, fakeInput} = buildReader();
    fakeInput.isRaw = true;

    const promise = reader.read<string>((_key, resolve) => resolve("x"));
    fakeInput.emit("data", Buffer.from("a"));

    await promise;
    expect(fakeInput.setRawMode).toHaveBeenLastCalledWith(true);
  });

  it("rejects and restores the terminal when the handler throws", async () => {
    const {reader, fakeInput} = buildReader();

    const promise = reader.read(() => {
      throw new Error("boom");
    });
    fakeInput.emit("data", Buffer.from("a"));

    await expect(promise).rejects.toThrow("boom");
    expect(fakeInput.setRawMode).toHaveBeenLastCalledWith(false);
    expect(fakeInput.listenerCount("data")).toBe(0);
  });

  it("reports interactivity from the stream TTY flags", () => {
    const {reader, fakeInput} = buildReader();
    reader.output = {isTTY: true, write: jest.fn()} as any;
    expect(reader.isInteractive()).toBe(true);

    fakeInput.isTTY = false;
    expect(reader.isInteractive()).toBe(false);
  });
});
