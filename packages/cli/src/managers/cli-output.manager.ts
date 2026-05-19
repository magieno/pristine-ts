import {injectable} from "tsyringe";
import {moduleScoped} from "@pristine-ts/common";
import {CliModuleKeyname} from "../cli.module.keyname";

/**
 * Pipe-friendly stdout primitives for the CLI. Use this when you need to emit text that
 * a user might redirect or pipe — help banners, command tables, JSON dumps — and the
 * `LogHandler` pipeline would be wrong because it can be severity-gated, routed to
 * stderr per-severity, or fanned out to file/Sentry transports. For event narration
 * ("Compiling X", "Server started"), use `LogHandler` instead.
 */
@injectable()
@moduleScoped(CliModuleKeyname)
export class CliOutput {

  /**
   * Writes a message to stdout without a newline.
   */
  write(message: string): void {
    process.stdout.write(message);
  }

  /**
   * Writes a message to stdout with a newline.
   */
  writeLine(message: string): void {
    process.stdout.write(message + "\n");
  }

  /**
   * Renders an array of objects as a table using Node's `console.table`.
   */
  writeTable(rows: any[]): void {
    console.table(rows);
  }
}
