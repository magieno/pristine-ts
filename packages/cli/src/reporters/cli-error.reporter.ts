import {injectable} from "tsyringe";
import {
  ExitCode,
  getPristineMode,
  PristineError,
  PristineErrorKind,
  PristineMode,
} from "@pristine-ts/common";

/**
 * Renders any thrown value to stderr and returns an appropriate process exit code.
 * Counterpart to networking's `HttpErrorResponder`: same `PristineError`-based contract,
 * different channel.
 *
 * **Production mode** (default): one-line `✗ CODE: message` for `UserError`s; a generic
 * `Internal Error` for `SystemError`s (raw `Error`s, third-party throws). No stack
 * trace, no cause chain.
 *
 * **Development mode** (`PRISTINE_MODE=development`): full message even for system errors,
 * structured details printed below, stack trace and cause chain appended at the end.
 * Useful when debugging locally.
 *
 * Exit code selection: `error.options.exitCode` wins when present. Otherwise:
 * `ExitCode.Error` (1) for user errors, `ExitCode.Software` (70) for system errors —
 * both follow `sysexits.h` conventions.
 *
 * **Crash-isolated**: every stderr write is wrapped — if stderr is closed/broken, we
 * still return an exit code rather than throwing back into the bin's catch handler.
 */
@injectable()
export class CliErrorReporter {
  /**
   * Writes the error to stderr and returns the exit code the caller should pass to
   * `process.exit`. The bin script wraps `bootstrap().catch(err => process.exit(reporter.report(err)))`.
   */
  report(error: unknown): number {
    const e = PristineError.from(error);
    const isDev = getPristineMode() === PristineMode.Development;
    const isUserError = e.options.kind !== PristineErrorKind.SystemError;

    // Headline: in production, system errors get a generic message so we don't dump
    // internal-bug messages to the user. User errors always show their own message.
    const headline = isUserError || isDev ? e.message : "Internal Error";
    const code = e.options.code ?? "ERROR";

    this.write(`✗ ${code}: ${headline}\n`);

    // Details: per-error-class structured fields. Surfaced for user errors always, for
    // system errors only in dev (helps debugging without leaking in prod CI logs).
    if (e.options.details && (isUserError || isDev)) {
      for (const [k, v] of Object.entries(e.options.details)) {
        const rendered = typeof v === "string" ? v : this.safeStringify(v);
        this.write(`  ${k}: ${rendered}\n`);
      }
    }

    // Stack + cause chain are dev-only. Production stderr stays clean.
    if (isDev) {
      if (e.stack) {
        this.write(`\n${e.stack}\n`);
      }
      let current: unknown = (e as Error).cause;
      let depth = 0;
      while (current instanceof Error && depth < 10) {
        this.write(`\ncaused by: ${current.name}: ${current.message}\n`);
        if (current.stack) this.write(`${current.stack}\n`);
        current = (current as Error).cause;
        depth++;
      }
    }

    // Exit code fallback: ExitCode.Error (1) for user errors, ExitCode.Software (70)
    // for system errors. Both follow sysexits.h conventions.
    return e.options.exitCode ?? (isUserError ? ExitCode.Error : ExitCode.Software);
  }

  /**
   * Wraps `process.stderr.write` so a broken stderr (closed pipe, etc.) doesn't itself
   * throw and confuse the bin's outer `.catch`. The exit code is the only thing that
   * matters when stderr is dead.
   */
  private write(text: string): void {
    try {
      process.stderr.write(text);
    } catch {
      // Nothing useful to do if stderr is unwritable.
    }
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

/**
 * Shared instance for the bin script — which can't go through DI because the kernel may
 * not be up yet when an error fires (kernel-boot failures). The class is stateless so
 * sharing is safe.
 */
export const cliErrorReporter = new CliErrorReporter();
