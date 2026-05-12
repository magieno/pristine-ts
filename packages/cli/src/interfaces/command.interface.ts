import {ClassConstructor} from "class-transformer";
import {ExitCodeEnum} from "../enums/exit-code.enum";

/**
 * The contract every CLI command implements. The CliEventHandler reads `optionsType` to
 * map raw `process.argv` flags onto a typed instance of the declared options class, runs
 * `class-validator` against the instance, and then calls `run(args)` with the validated
 * instance.
 *
 * `optionsType` MUST be a class constructor (the class itself, e.g. `optionsType = MyOptions`)
 * — not an instance. Set it to `null` for commands that don't accept any options. Returning
 * an instance from a property declared as a constructor was a long-standing footgun: the
 * data mapper silently failed and the validator never ran, so `run(args)`'s typed signature
 * lied. The class-constructor contract makes the mapping/validation pipeline work as designed.
 *
 * Type parameter `T` is the options class. Commands without options use `null`.
 */
export interface CommandInterface<T> {
  name: string;

  /**
   * Optional one-line summary shown by `pristine help`. Keep it short — multi-line
   * descriptions belong in the command's own documentation, not in the help output.
   */
  description?: string;

  /**
   * Constructor of the class that describes this command's CLI flags, decorated with
   * `class-validator` rules. Use `null` for commands that take no flags.
   */
  optionsType: ClassConstructor<T> | null;

  /**
   * Invoked with a validated instance of `optionsType` (when `optionsType` is non-null) or
   * the raw parsed argv shape (when `optionsType` is null). Return an exit code.
   */
  run(args: T): Promise<ExitCodeEnum | number>;
}
