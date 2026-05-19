/**
 * Standard process exit codes, drawn from BSD's `sysexits.h` conventions. Surfaced by
 * `CliErrorReporter` and `PristineError.options.exitCode` so shell pipelines can branch on
 * meaningful failure categories rather than the binary "0 or non-zero" distinction.
 *
 * **Use the enum for framework-standard codes.** Consumers can pass raw numbers for any
 * custom exit code — `PristineErrorOptions.exitCode` is typed `ExitCode | number`.
 *
 * Note that exit codes ≥ 64 (`Usage` and above) follow the `sysexits.h` registered
 * meanings; lower codes (1, etc.) are conventional but not standardized.
 *
 * ```ts
 * throw new ConfigError("Missing DATABASE_URL", {
 *   exitCode: ExitCode.Configuration,   // 78 — picked up by shells aware of sysexits.h
 * });
 *
 * throw new UsageError("Unknown flag --foo", {
 *   exitCode: ExitCode.Usage,           // 64
 * });
 * ```
 */
export enum ExitCode {
  /** Successful termination. */
  Success         = 0,

  /** Generic error. Default fallback for user-facing errors that don't specify a code. */
  Error           = 1,

  /** Command-line usage error (`EX_USAGE`). Bad flags, missing required args, unknown commands. */
  Usage           = 64,

  /** Input data malformed (`EX_DATAERR`). Validation failed, body unparseable. */
  DataError       = 65,

  /** Internal software error (`EX_SOFTWARE`). Default fallback for system errors. */
  Software        = 70,

  /** Can't create user output file (`EX_CANTCREAT`). */
  Cantcreat       = 73,

  /** Input/output error (`EX_IOERR`). */
  IoError         = 74,

  /** Temporary failure, retry might succeed (`EX_TEMPFAIL`). */
  Temporary       = 75,

  /** Remote error in protocol (`EX_PROTOCOL`). */
  Protocol        = 76,

  /** Permission denied (`EX_NOPERM`). Authentication / authorization failures. */
  NoPermission    = 77,

  /** Configuration error (`EX_CONFIG`). Missing or invalid config. */
  Configuration   = 78,
}
