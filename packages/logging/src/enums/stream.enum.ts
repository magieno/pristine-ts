/**
 * Which standard stream a logger should write to for a given severity. Used by the
 * ConsoleLogger to pick between `process.stdout` and `process.stderr` per-severity via
 * configuration.
 */
export enum StreamEnum {
  Stdout = "stdout",
  Stderr = "stderr",
}
