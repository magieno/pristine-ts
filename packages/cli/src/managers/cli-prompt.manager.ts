import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import * as readline from "node:readline/promises";
import {moveCursor, clearLine, cursorTo} from "node:readline";
import {stdin as input, stdout as output} from "node:process";
import {ConsoleReadlineOptions} from "../options/console-readline.options";
import {TerminalKeyReader} from "./terminal-key-reader.manager";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";
import {BooleanAnswerParser} from "../utils/boolean-answer-parser";
import {PromptCancelledError} from "../errors/prompt-cancelled.error";

/**
 * Interactive terminal prompts for CLI commands, implemented entirely on Node's `readline`
 * and raw-mode stdin — no third-party prompt library. Line-based prompts (`readLine`,
 * `input`, `confirm`) go through `readline/promises`; the keystroke-level prompts (`select`
 * arrow menu, masked `readSecret`) go through {@link TerminalKeyReader}.
 *
 * `Ctrl+C` rejects with {@link PromptCancelledError} across all of them — the line prompts
 * via a `readline` SIGINT handler, the raw-mode prompts via the key reader — so callers get
 * one consistent cancellation signal.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CliPrompt {
  // ANSI constants, matching the conventions used by CliSpinner / CliProgressBar.
  private static readonly CYAN = "\x1b[36m";
  private static readonly DIM = "\x1b[2m";
  private static readonly RESET = "\x1b[0m";
  private static readonly HIDE_CURSOR = "\x1B[?25l";
  private static readonly SHOW_CURSOR = "\x1B[?25h";
  private static readonly POINTER = "❯";

  constructor(private readonly terminalKeyReader: TerminalKeyReader) {
  }

  /**
   * Reads a string from stdin synchronously. Returns whatever `process.stdin.read()`
   * gives back (which may be `null` when no data is buffered).
   */
  read(): string {
    return process.stdin.read() as string;
  }

  /**
   * Reads a line from stdin after displaying a prompt. When
   * `options.showCharactersOnTyping` is false, the answered line is cleared and replaced
   * with a masked echo so the typed value isn't left visible on screen (a post-input clear,
   * not true keystroke suppression — use {@link readSecret} for real masking).
   *
   * `Ctrl+C` rejects with {@link PromptCancelledError}: registering a `SIGINT` listener on
   * the readline interface overrides Node's default interrupt handling, turning it into a
   * clean rejection rather than a hung promise.
   */
  async readLine(question: string, options: ConsoleReadlineOptions = new ConsoleReadlineOptions()): Promise<string> {
    const rl = readline.createInterface({input, output});

    try {
      const answer = await new Promise<string>((resolve, reject) => {
        rl.on("SIGINT", () => reject(new PromptCancelledError()));
        rl.question(question).then(resolve, reject);
      });

      if (!options.showCharactersOnTyping) {
        moveCursor(output, 0, -1);
        clearLine(output, 0);
        process.stdout.write(`${question} [******]\n`);
      }

      return answer;
    } finally {
      rl.close();
    }
  }

  /**
   * Asks a free-text question, optionally with a default. The default is shown as a hint and
   * returned verbatim when the user submits an empty line. The answer is trimmed.
   */
  async input(message: string, defaultValue?: string): Promise<string> {
    const suffix = defaultValue !== undefined && defaultValue !== ""
      ? ` ${CliPrompt.DIM}(${defaultValue})${CliPrompt.RESET}`
      : "";

    const answer = (await this.readLine(`${message}${suffix} `)).trim();
    if (answer.length === 0 && defaultValue !== undefined) {
      return defaultValue;
    }
    return answer;
  }

  /**
   * Asks a yes/no question. An empty answer takes the default; anything `BooleanAnswerParser`
   * understands (`y`/`yes`/`true`/`1`, `n`/`no`/`false`/`0`) is accepted; anything else is
   * re-asked. The default is shown capitalized in the `(Y/n)` / `(y/N)` hint.
   */
  async confirm(message: string, defaultValue: boolean = true): Promise<boolean> {
    const hint = defaultValue ? "(Y/n)" : "(y/N)";

    for (; ;) {
      const raw = (await this.readLine(`${message} ${hint} `)).trim();
      if (raw.length === 0) {
        return defaultValue;
      }

      const parsed = BooleanAnswerParser.parse(raw);
      if (parsed !== undefined) {
        return parsed;
      }

      process.stdout.write("Please answer yes (y) or no (n).\n");
    }
  }

  /**
   * Presents an arrow-key menu and returns the chosen choice's `value`. `↑`/`↓` move the
   * highlight (wrapping at the ends), `Enter` selects, `Ctrl+C` cancels. When `defaultValue`
   * matches a choice, the menu starts on it. The cursor is hidden while the menu is active
   * and restored afterward.
   */
  async select<T>(message: string, choices: {name: string; value: T}[], defaultValue?: T): Promise<T> {
    if (choices.length === 0) {
      throw new Error("CliPrompt.select requires at least one choice.");
    }

    const defaultIndex = choices.findIndex((choice) => choice.value === defaultValue);
    let active = defaultIndex >= 0 ? defaultIndex : 0;

    process.stdout.write(CliPrompt.HIDE_CURSOR);
    process.stdout.write(`${CliPrompt.CYAN}?${CliPrompt.RESET} ${message}\n`);
    this.renderChoices(choices, active);

    try {
      return await this.terminalKeyReader.read<T>((key, resolve) => {
        if (key.name === TerminalKeyName.Up) {
          active = (active - 1 + choices.length) % choices.length;
          this.repaintChoices(choices, active);
        } else if (key.name === TerminalKeyName.Down) {
          active = (active + 1) % choices.length;
          this.repaintChoices(choices, active);
        } else if (key.name === TerminalKeyName.Enter) {
          resolve(choices[active].value);
        }
      });
    } finally {
      process.stdout.write(CliPrompt.SHOW_CURSOR);
    }
  }

  /**
   * Reads a secret (password, token, …) from stdin with the typed characters masked as `*`.
   * Real keystroke suppression via raw mode (unlike {@link readLine}'s post-input clear):
   * each character echoes a `*`, `Backspace` erases one, `Enter` submits, `Ctrl+C` cancels.
   * The value is returned untrimmed — a secret may legitimately contain surrounding
   * whitespace.
   */
  async readSecret(question: string): Promise<string> {
    process.stdout.write(question);

    let value = "";
    try {
      await this.terminalKeyReader.read<void>((key, resolve) => {
        if (key.name === TerminalKeyName.Enter) {
          resolve(undefined);
        } else if (key.name === TerminalKeyName.Backspace) {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (key.name === TerminalKeyName.Character) {
          value += key.sequence;
          process.stdout.write("*");
        }
      });
    } finally {
      process.stdout.write("\n");
    }

    return value;
  }

  /**
   * Writes the choice rows, highlighting the active one with a colored pointer. Each row is
   * cleared before it's written (so a repaint never leaves a longer previous label behind) and
   * clipped to the terminal width by {@link formatChoiceRow} (so a row never wraps — see there).
   * @private
   */
  private renderChoices<T>(choices: {name: string; value: T}[], active: number): void {
    choices.forEach((choice, index) => {
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      process.stdout.write(`${this.formatChoiceRow(choice.name, index === active)}\n`);
    });
  }

  /**
   * Builds one choice row — `❯ <name>` for the active row, `  <name>` otherwise — CLIPPED to the
   * terminal width so a label longer than the terminal can't wrap onto a second screen row.
   * {@link repaintChoices} backs the cursor up by the choice COUNT, which only lands on the first
   * row if every choice occupies exactly one screen row; a wrapped row desyncs that count and the
   * redraw duplicates (and, via the per-row clear, corrupts) the menu. The colour codes are
   * zero-width, so the visible text is clipped first and then wrapped in colour; `- 1` keeps the
   * row one column short of the edge, dodging the terminal's last-column "pending wrap".
   * @private
   */
  private formatChoiceRow(name: string, isActive: boolean): string {
    const text = `${isActive ? `${CliPrompt.POINTER} ` : "  "}${name}`;
    const width = Math.max(1, (process.stdout.columns || 80) - 1);
    const clipped = text.length > width ? `${text.slice(0, width - 1)}…` : text;
    return isActive ? `${CliPrompt.CYAN}${clipped}${CliPrompt.RESET}` : clipped;
  }

  /**
   * Moves the cursor back up over the previously-rendered choice rows and rewrites them, so the
   * menu updates in place as the selection moves. Relies on every choice occupying exactly one
   * screen row — guaranteed by {@link formatChoiceRow}'s width clip — so `-choices.length` lands
   * back on the first row.
   * @private
   */
  private repaintChoices<T>(choices: {name: string; value: T}[], active: number): void {
    moveCursor(process.stdout, 0, -choices.length);
    this.renderChoices(choices, active);
  }
}
