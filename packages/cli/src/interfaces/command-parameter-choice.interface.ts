/**
 * A single selectable choice for a `@commandParameter` whose value comes from a fixed or
 * runtime-resolved set. `name` is what the interactive menu shows; `value` is what gets bound
 * to the parameter (and validated) when the choice is picked.
 *
 * A bare `string` is accepted anywhere a `CommandParameterChoice` is — it expands to
 * `{name: value, value: value}`.
 */
export interface CommandParameterChoice {
  /** Human-readable label rendered in the selection menu. */
  name: string;

  /** Value bound to the parameter when this choice is selected. */
  value: string;
}
