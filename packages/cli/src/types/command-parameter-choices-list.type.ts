import {CommandParameterChoice} from "../interfaces/command-parameter-choice.interface";

/**
 * The result of resolving a parameter's choices: an ordered list where each entry is either a
 * `{name, value}` pair or a bare `string` (shorthand for `{name: s, value: s}`).
 */
export type CommandParameterChoicesList = ReadonlyArray<string | CommandParameterChoice>;
