import {inject, injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {LogHandlerInterface} from "@pristine-ts/logging";
import {CliModuleKeyname} from "../cli.module.keyname";
import {clearLine, cursorTo} from "node:readline";

/**
 * Animated spinner for indicating long-running work in a TTY. Hides the cursor while
 * spinning, redraws the current line every 80ms, and routes the completion message
 * through the injected `LogHandler` so success/failure rendering matches the rest of
 * the framework.
 *
 * Avoid emitting other output (especially LogHandler narration) while the spinner is
 * active — concurrent writes will fight the spinner's line clearing and produce visual
 * artifacts.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CliSpinner {
  private spinnerInterval: NodeJS.Timeout | null = null;
  private isSpinning = false;

  private static readonly FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private static readonly FRAME_INTERVAL_MS = 80;
  private static readonly CYAN = "\x1b[36m";
  private static readonly RESET = "\x1b[0m";
  private static readonly HIDE_CURSOR = "\x1B[?25l";
  private static readonly SHOW_CURSOR = "\x1B[?25h";

  constructor(@inject("LogHandlerInterface") private readonly logHandler: LogHandlerInterface) {
  }

  /**
   * Starts the spinner with the given label. Subsequent calls are no-ops until `stop()`
   * is invoked.
   */
  start(message: string): void {
    if (this.isSpinning) return;
    this.isSpinning = true;
    let i = 0;

    process.stdout.write(CliSpinner.HIDE_CURSOR);

    this.spinnerInterval = setInterval(() => {
      clearLine(process.stdout, 0);
      cursorTo(process.stdout, 0);
      const frame = CliSpinner.FRAMES[i = (i + 1) % CliSpinner.FRAMES.length];
      process.stdout.write(`${CliSpinner.CYAN}${frame}${CliSpinner.RESET} ${message}`);
    }, CliSpinner.FRAME_INTERVAL_MS);
  }

  /**
   * Stops the spinner, restores the cursor, and optionally emits a final completion
   * message. `success` controls whether the message is rendered as a success log
   * (`logHandler.success`) or an error log (`logHandler.error`).
   */
  stop(message?: string, success: boolean = true): void {
    if (!this.isSpinning) return;
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    this.isSpinning = false;
    clearLine(process.stdout, 0);
    cursorTo(process.stdout, 0);
    process.stdout.write(CliSpinner.SHOW_CURSOR);

    if (message) {
      if (success) {
        this.logHandler.success(message);
      } else {
        this.logHandler.error(message);
      }
    }
  }
}
