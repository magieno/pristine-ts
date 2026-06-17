/**
 * Interprets a free-text answer as a boolean the way traditional CLIs do — accepting
 * `y`/`yes`/`true`/`1` and `n`/`no`/`false`/`0` (case-insensitive, surrounding whitespace
 * ignored). Returns `undefined` for anything unrecognized so callers can re-ask.
 *
 * Shared by `CliPrompt.confirm` (yes/no prompts) and `CommandParameterPrompter` (typed
 * boolean parameters) so both accept exactly the same set of answers.
 */
export class BooleanAnswerParser {
  static parse(raw: string): boolean | undefined {
    const normalized = raw.trim().toLowerCase();
    if (normalized === "y" || normalized === "yes" || normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "n" || normalized === "no" || normalized === "false" || normalized === "0") {
      return false;
    }
    return undefined;
  }
}
