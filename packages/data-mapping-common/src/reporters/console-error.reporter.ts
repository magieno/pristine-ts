import {DataMapperErrorReporter} from "../types/data-mapper-error-reporter.type";

/**
 * Built-in default reporter. Writes a header line + the error + a structured context payload
 * to `console.error`. Used when no custom reporter is supplied to DataMapper — gives the
 * frontend (and any non-DI caller) useful output out of the box.
 *
 * Exposed as a class-with-static-method so callers can compose it from their own reporters,
 * e.g. `(err, ctx) => { sendToSentry(err); ConsoleErrorReporter.report(err, ctx); }`.
 */
export class ConsoleErrorReporter {
  /**
   * Matches the `DataMapperErrorReporter` shape so a method reference (`ConsoleErrorReporter.report`)
   * can be passed wherever the callback type is expected.
   */
  public static readonly report: DataMapperErrorReporter = (error, context) => {
    // eslint-disable-next-line no-console
    console.error("[DataMapper] autoMap caught an error.", error, context);
  };
}
