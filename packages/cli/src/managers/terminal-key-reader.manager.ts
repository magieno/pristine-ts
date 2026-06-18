import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import {TerminalKey} from "../interfaces/terminal-key.interface";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";
import {TerminalKeyDecoder} from "../utils/terminal-key-decoder";
import {PromptCancelledError} from "../errors/prompt-cancelled.error";

/**
 * Owns the raw-mode keystroke reading the interactive prompts need (arrow-key `select`,
 * masked `readSecret`) — the one place in the CLI that flips stdin into raw mode. Node's
 * stock `readline` is line-buffered and echoes input, so it can't drive an arrow-key menu
 * or suppress a password's characters; this reads keys one at a time instead.
 *
 * Two responsibilities are handled centrally so callers don't each reimplement them:
 *   - **Cancellation:** `Ctrl+C` rejects the read with {@link PromptCancelledError}.
 *   - **Terminal restore:** raw mode is entered on start and restored in every exit path,
 *     so a thrown handler or a cancellation never leaves the terminal in raw mode.
 *
 * The `input`/`output` fields default to the process streams and exist as a seam so tests
 * can drive synthetic keystrokes without a real TTY.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class TerminalKeyReader {
  input: NodeJS.ReadStream = process.stdin;
  output: NodeJS.WriteStream = process.stdout;

  /**
   * Whether both stdin and stdout are interactive terminals. Raw-mode reading is only
   * meaningful on a real TTY; callers fall back (or skip prompting) when this is false.
   */
  isInteractive(): boolean {
    return Boolean(this.input.isTTY) && Boolean(this.output.isTTY);
  }

  /**
   * Reads keystrokes in raw mode, handing each decoded {@link TerminalKey} to `onKey` until
   * `onKey` ends the read by invoking its `resolve` callback with the result. Resolves to
   * that value; rejects with {@link PromptCancelledError} on `Ctrl+C`. Raw mode is entered
   * on start and restored to its prior state in every exit path.
   */
  read<T>(onKey: (key: TerminalKey, resolve: (value: T) => void) => void): Promise<T> {
    const input = this.input;
    const wasRaw = input.isRaw === true;

    return new Promise<T>((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        input.removeListener("data", onData);
        if (input.isTTY && typeof input.setRawMode === "function") {
          input.setRawMode(wasRaw);
        }
        input.pause();
      };

      const settle = (run: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        run();
      };

      const onData = (data: Buffer | string) => {
        for (const key of TerminalKeyDecoder.decode(data.toString())) {
          if (key.name === TerminalKeyName.CtrlC) {
            settle(() => reject(new PromptCancelledError()));
            return;
          }

          try {
            onKey(key, (value: T) => settle(() => resolve(value)));
          } catch (error) {
            settle(() => reject(error as Error));
            return;
          }

          if (settled) {
            return;
          }
        }
      };

      if (input.isTTY && typeof input.setRawMode === "function") {
        input.setRawMode(true);
      }
      input.resume();
      input.on("data", onData);
    });
  }
}
