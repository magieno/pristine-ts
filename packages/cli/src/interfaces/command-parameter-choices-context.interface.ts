/**
 * Passed to a dynamic choices resolver (a function or a
 * `CommandParameterChoicesProviderInterface`) so it can compute the allowed values from the
 * arguments resolved so far — e.g. list the tables of whichever `--database` was already
 * answered.
 */
export interface CommandParameterChoicesContext {
  /**
   * The arguments known so far: flags passed on the command line plus any values already
   * answered interactively earlier in the same prompt pass. Keyed by property name.
   */
  args: Record<string, any>;

  /** The options-class property whose choices are being resolved. */
  propertyKey: string;

  /** The effective CLI flag for that property (the `flag` override, or the property name). */
  flag: string;
}
