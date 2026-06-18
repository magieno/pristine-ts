import {TerminalKey} from "../interfaces/terminal-key.interface";
import {TerminalKeyName} from "../enums/terminal-key-name.enum";

/**
 * Translates the raw bytes Node delivers from a raw-mode stdin into structured
 * {@link TerminalKey}s. Pure and static so it can be unit-tested without a real TTY.
 *
 * A single `data` chunk can carry more than one keystroke (notably a paste, or fast
 * typing), so this returns an array. Control and escape sequences are recognized as one
 * key each; a run of printable characters is split into one `Character` key per character
 * so callers (masked input, menus) can echo and handle them uniformly.
 */
export class TerminalKeyDecoder {
  /**
   * Decodes a raw stdin chunk into the keys it represents.
   *
   *   - A recognized control byte / escape sequence that spans the whole chunk → one key.
   *   - An unrecognized escape sequence (starts with ESC) → a single `Other` key, rather
   *     than splitting it into bogus printable characters.
   *   - Anything else → one key per character, with non-printable control bytes mapped to
   *     `Other` so they're ignored rather than echoed.
   */
  static decode(data: string): TerminalKey[] {
    const whole = TerminalKeyDecoder.decodeControl(data);
    if (whole !== undefined) {
      return [whole];
    }

    if (data.charCodeAt(0) === 0x1b) {
      return [{name: TerminalKeyName.Other, sequence: data}];
    }

    const keys: TerminalKey[] = [];
    for (const character of data) {
      const control = TerminalKeyDecoder.decodeControl(character);
      if (control !== undefined) {
        keys.push(control);
      } else if (character.charCodeAt(0) < 0x20) {
        keys.push({name: TerminalKeyName.Other, sequence: character});
      } else {
        keys.push({name: TerminalKeyName.Character, sequence: character});
      }
    }
    return keys;
  }

  /**
   * Maps a single recognized control byte or escape sequence to its key, or `undefined`
   * when the input isn't one we handle.
   * @private
   */
  private static decodeControl(sequence: string): TerminalKey | undefined {
    switch (sequence) {
      case "\x1b[A":
        return {name: TerminalKeyName.Up, sequence};
      case "\x1b[B":
        return {name: TerminalKeyName.Down, sequence};
      case "\r":
      case "\n":
        return {name: TerminalKeyName.Enter, sequence};
      case "\x7f":
      case "\b":
        return {name: TerminalKeyName.Backspace, sequence};
      case "\x03":
        return {name: TerminalKeyName.CtrlC, sequence};
    }
    return undefined;
  }
}
