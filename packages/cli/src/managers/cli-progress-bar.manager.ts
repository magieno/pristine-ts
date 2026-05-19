import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";
import {clearLine, cursorTo} from "node:readline";

/**
 * Inline progress bar rendered on the current TTY line. Each call clears and redraws
 * the line, so callers must not interleave other output (LogHandler narration, raw
 * CliOutput writes, etc.) between updates or the previous bar will be left behind on
 * the line above.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CliProgressBar {

  private static readonly FILLED = "█";
  private static readonly EMPTY = "░";
  private static readonly CYAN = "\x1b[36m";
  private static readonly RESET = "\x1b[0m";

  /**
   * Renders the progress bar at the current line. When `current >= total` the cursor
   * is advanced to the next line so subsequent output doesn't overwrite the finished bar.
   */
  update(current: number, total: number, message: string = "", width: number = 30): void {
    const percentage = Math.min(Math.max(current / total, 0), 1);
    const filledWidth = Math.round(width * percentage);
    const emptyWidth = width - filledWidth;

    const filledBar = CliProgressBar.FILLED.repeat(filledWidth);
    const emptyBar = CliProgressBar.EMPTY.repeat(emptyWidth);

    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    process.stdout.write(`${CliProgressBar.CYAN}[${filledBar}${emptyBar}]${CliProgressBar.RESET} ${Math.round(percentage * 100)}% ${message}`);

    if (current >= total) {
      process.stdout.write("\n");
    }
  }
}
