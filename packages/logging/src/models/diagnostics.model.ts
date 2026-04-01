/**
 * The diagnostic model represents detailed information to help debug that will be outputted in the extras of the log
 * when diagnostic is enabled.
 */
export class DiagnosticsModel {

  /**
   * The node version on which the code was executed.
   */
  nodeVersion?: string;

  /**
   * An array representing the stack trace from which the log originated.
   */
  stackTrace: {
    /**
     * The class name at which it was called in the stack trace.
     */
    className: string;

    /**
     * The class name at which it was called in the stack trace.
     */
    filename: string;

    /**
     * The line at which it was called in the stack trace
     */
    line: string;

    /**
     * The column at which it was called in the stack trace
     */
    column: string;
  }[] = [];

  /**
   * The very last element of the stack trace to know precisely where the log originated from.
   */
  lastStackTrace?: {
    /**
     * The class name at which it was called in the stack trace.
     */
    className: string;

    /**
     * The class name at which it was called in the stack trace.
     */
    filename: string;

    /**
     * The line at which it was called in the stack trace
     */
    line: string;

    /**
     * The column at which it was called in the stack trace
     */
    column: string;
  };
}
