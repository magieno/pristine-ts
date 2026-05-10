import {ExitCodeEnum} from "../enums/exit-code.enum";

export interface CommandInterface<ArgumentsOptionsType> {
  name: string;

  /**
   * Optional one-line summary shown by `pristine p:help`. Keep it short — multi-line
   * descriptions belong in the command's own documentation, not in the help output.
   */
  description?: string;

  optionsType: ArgumentsOptionsType;

  run(args: ArgumentsOptionsType): Promise<ExitCodeEnum | number>;
}