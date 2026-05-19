/**
 * Shape of `pristine.config.{ts,js}` as understood by the configuration system. Only the
 * `config:` block is consumed here — the `cli:` block (and any future tool-specific
 * blocks) are read by their respective tools. Unknown top-level fields pass through
 * untouched.
 */
export interface PristineConfigFile {
  /**
   * Runtime configuration values keyed by `configurationDefinition.parameterName`. Sits in
   * the precedence chain above per-key `defaultResolvers` and below explicit overrides
   * passed to `kernel.start()`.
   */
  config?: Record<string, unknown>;
  [otherBlock: string]: unknown;
}
