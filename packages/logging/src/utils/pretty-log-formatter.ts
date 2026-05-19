import format from "date-fns/format";
import {LogModel} from "../models/log.model";
import {SeverityEnum} from "../enums/severity.enum";
import {Utils} from "./utils";

/**
 * Renders a `LogModel` as a colored, icon-prefixed single line for interactive terminals.
 *
 * Pretty mode is deliberately compact: severity badge + message + optional indented
 * highlights. The `extra` payload is intentionally not rendered here — it remains on the
 * `LogModel` for JSON/file/Sentry transports, where machine-readable depth matters more
 * than terminal readability.
 *
 * This formatter lives in `@pristine-ts/logging` (not `@pristine-ts/cli`) because the
 * ConsoleLogger that consumes it lives here, and a one-way dependency from logging → cli
 * would invert the module hierarchy.
 */
export class PrettyLogFormatter {

  /**
   * Renders the log entry. Static because it has no per-instance state and we want
   * callers to invoke it as `PrettyLogFormatter.format(log)` without managing a lifecycle.
   */
  public static format(log: LogModel): string {
    const {icon, color} = PrettyLogFormatter.iconAndColor(log.severity);
    const timestamp = format(log.date, "yyyy-MM-dd HH:mm:ss.SSS");
    const severityLabel = Utils.getSeverityText(log.severity);

    const head = `${Ansi.Dim}${timestamp}${Ansi.Reset} ${color}${icon} [${severityLabel}]${Ansi.Reset} ${log.message}`;

    const highlights = PrettyLogFormatter.renderHighlights(log);
    return head + highlights;
  }

  private static iconAndColor(severity: SeverityEnum): {icon: string; color: string} {
    switch (severity) {
      case SeverityEnum.Debug:
        return {icon: "·", color: Ansi.Dim};
      case SeverityEnum.Info:
        return {icon: "ℹ", color: Ansi.FgCyan};
      case SeverityEnum.Success:
        return {icon: "✔", color: Ansi.FgGreen};
      case SeverityEnum.Notice:
        return {icon: "ℹ", color: Ansi.FgBlue};
      case SeverityEnum.Warning:
        return {icon: "⚠", color: Ansi.FgYellow};
      case SeverityEnum.Error:
        return {icon: "✖", color: Ansi.FgRed};
      case SeverityEnum.Critical:
        return {icon: "✖", color: Ansi.Bright + Ansi.FgRed};
    }
  }

  private static renderHighlights(log: LogModel): string {
    if (!log.highlights) {
      return "";
    }

    let out = "";
    for (const key in log.highlights) {
      out += `\n\t- ${key}: ${JSON.stringify(Utils.truncate(log.highlights[key], 4))}`;
    }
    return out;
  }
}

/**
 * ANSI escape codes used by the Pretty formatter. Deliberately not shared with the CLI
 * package's color table — keeping `@pristine-ts/logging` free of any dependency on
 * `@pristine-ts/cli`.
 */
const Ansi = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgCyan: "\x1b[36m",
};
