import {TerminalKeyName} from "../enums/terminal-key-name.enum";

/**
 * A single decoded keypress from an interactive terminal. `name` classifies the key;
 * `sequence` is the raw character(s) it produced — meaningful for `Character` keys (the
 * literal typed character, echoed/accumulated by callers) and retained for the rest for
 * diagnostics.
 */
export interface TerminalKey {
  name: TerminalKeyName;
  sequence: string;
}
