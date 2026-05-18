import {injectable} from "tsyringe";
import {getPristineMode, PristineError, PristineMode} from "@pristine-ts/common";

/**
 * Renders any thrown value to stderr and returns an appropriate process exit code.
 * Counterpart to networking's `HttpErrorResponder`: same `PristineError`-based contract,
 * different channel.
 *
 * **Production mode** (default): one-line `✗ CODE: message` for expected errors; a
 * generic `Internal Error` for unexpected ones (raw `Error`s, third-party throws). No
 * stack trace, no cause chain.
 *
 * **Development mode** (`PRISTINE_MODE=development`): full message even for unexpected
 * errors, structured details printed below, stack trace and cause chain appended at the
 * end. Useful when debugging locally.
 *
 * Exit code selection: `error.options.exitCode` wins when present. Otherwise: `1` for
 * expected errors, `70` (`EX_SOFTWARE`) for unexpected ones — both choices align with
 * sysexits.h conventions.
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

    // Headline: in production, unexpected errors get a generic message so we don't dump
    // internal-bug messages to the user. Expected errors always show their own message.
    const headline = e.options.expected || isDev ? e.message : "Internal Error";
    const code = e.options.code ?? "ERROR";

    this.write(`✗ ${code}: ${headline}\n`);

    // Details: per-error-class structured fields. Surfaced for expected errors always,
    // for unexpected only in dev (helps debugging without leaking in prod CI logs).
    if (e.options.details && (e.options.expected || isDev)) {
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

    // Exit code fallback: 1 for expected (user did something wrong), 70 (EX_SOFTWARE)
    // for unexpected (we did something wrong). Either is the right thing for shell
    // pipelines.
    return e.options.exitCode ?? (e.options.expected ? 1 : 70);
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
