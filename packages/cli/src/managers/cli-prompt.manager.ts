import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import * as readline from "node:readline/promises";
import {moveCursor, clearLine} from "node:readline";
import {stdin as input, stdout as output} from "node:process";
import {ConsoleReadlineOptions} from "../options/console-readline.options";

/**
 * Interactive stdin reader for CLI commands. Wraps Node's `readline/promises` and offers
 * a single `readLine` method with optional masking after input is received.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CliPrompt {

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
   * with a masked echo so the typed value isn't left visible on screen.
   *
   * Note: this is not a true keystroke-suppressing password input — Node's stock
   * `readline` does not support that without raw-mode handling. The current behavior is
   * a post-input clear, sufficient for most CLI prompts.
   */
  async readLine(question: string, options: ConsoleReadlineOptions = new ConsoleReadlineOptions()): Promise<string> {
    const rl = readline.createInterface({input, output});

    const answer = await rl.question(question);

    if (!options.showCharactersOnTyping) {
      moveCursor(output, 0, -1);
      clearLine(output, 0);
      process.stdout.write(`${question} [******]\n`);
    }

    rl.close();

    return answer;
  }
}
