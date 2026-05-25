import {SeverityEnum} from "../enums/severity.enum";
import {LogHighlights} from "../types/log-highlights.type";
import {OutputHints} from "../types/output-hints.type";

/**
 * The model that represents a log.
 *
 * Logs carry their own content only — no inline breadcrumb trail. To reconstruct "what
 * happened" around a log entry, look at the trace via the registered tracers
 * (ConsoleTracer, the observability tracer, X-Ray, etc.) using the `traceId`/`eventId` on the log.
 */
export class LogModel {
  /**
   * The eventId associated with the log.
   */
  eventId?: string

  /**
   * The Event Group that all the events are a part of.
   */
  eventGroupId?: string;

  /**
   * The trace id from which the log originated.
   */
  traceId?: string;

  /**
   * The kernel instantiation id from which the log originated.
   */
  kernelInstantiationId?: string;

  /**
   * The date at which the log was created.
   */
  date: Date = new Date();

  /**
   * The module from which the log originated.
   * By default it will be the application module.
   */
  module: string = "application";

  /**
   * Extras are additional data that provide extra context. They should be shown only when deeply investigating.
   */
  extra: any;

  /**
   * This is an object that is data that you want to "highlights" and show as logs. Select and be careful about what
   * you choose to highlight to avoid showing to many useless things.
   */
  highlights: LogHighlights = {};

  /**
   * Output hints that loggers may use. Not authoritative; loggers retain final say.
   */
  outputHints: OutputHints = {};

  /**
   * The model that represents a log
   * @param severity The log severity.
   * @param message The actual log message that needs to be outputted.
   */
  constructor(public severity: SeverityEnum, public message: string) {
  }

}
