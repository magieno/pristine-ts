/**
 * The severity supported for logging purposes.
 *
 * Ranks are ordered low → high so consumers can gate by `severity >= threshold`. `Success`
 * slots between `Info` and `Notice`: it's a positive event that should be visible at the
 * default `Info` threshold but hidden when the operator only wants to see problems
 * (threshold ≥ `Warning`).
 */
export enum SeverityEnum {
  Critical = 6,
  Error = 5,
  Warning = 4,
  Notice = 3,
  Success = 2,
  Info = 1,
  Debug = 0,
}
