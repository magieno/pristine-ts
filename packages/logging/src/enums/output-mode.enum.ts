/**
 * Output mode for the logs.
 */
export enum OutputModeEnum {
  /**
   * The logs will output a JSON format.
   */
  Json = "JSON",
  /**
   * The logs will output a simple string format.
   */
  Simple = "SIMPLE",
  /**
   * The logs will output a colored, icon-prefixed single-line format intended for
   * interactive terminals. Renders the message, severity badge, and `highlights` only;
   * `extra` is omitted (still preserved in the LogModel for JSON/file/Sentry transports).
   */
  Pretty = "PRETTY",
}
