/**
 * The kinds of keypress the CLI's interactive prompts understand. `TerminalKeyDecoder`
 * maps the raw bytes Node delivers from a raw-mode stdin onto one of these; every printable
 * keystroke collapses to `Character` (with the literal character carried separately on
 * {@link TerminalKey}). `Other` covers control/escape sequences the prompts don't act on
 * (function keys, unhandled arrows) so callers can ignore them instead of echoing garbage.
 */
export enum TerminalKeyName {
  Up = "up",
  Down = "down",
  Enter = "enter",
  Backspace = "backspace",
  CtrlC = "ctrl-c",
  Character = "character",
  Other = "other",
}
