import {PristineError, PristineErrorKind} from "@pristine-ts/common";
import {CliErrorCode} from "./cli-error-code.enum";

/**
 * Thrown when the user cancels an interactive prompt with `Ctrl+C`. A clean, user-initiated
 * cancellation — not a crash — so it carries `kind: UserError` (the `CliErrorReporter`
 * renders the message verbatim instead of a stack dump) and exit code `130`, following the
 * POSIX `128 + SIGINT(2)` convention so shell pipelines can detect the interrupt.
 *
 * Callers that treat cancellation as a normal branch (e.g. `BuildStalenessPrompt`) catch it
 * via `instanceof`; everywhere else it propagates to the reporter for a tidy exit.
 */
export class PromptCancelledError extends PristineError {
  public constructor() {
    super("Prompt cancelled.", {
      code: CliErrorCode.PromptCancelled,
      exitCode: 130,
      kind: PristineErrorKind.UserError,
    });
  }
}
