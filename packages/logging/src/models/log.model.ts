import {SeverityEnum} from "../enums/severity.enum";
import {BreadcrumbModel} from "./breadcrumb.model";
import {LogHighlights} from "../types/log-highlights.type";

/**
 * The model that represents a log
 */
export class LogModel {
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
   * @deprecated: Use breadcrumbs instead.
   */
  module: string = "application";

  /**
   * Extras are additional data that provide extra context. They should be shown only when deeply investigating.
   */
  extra: any;

  /**
   * The list of breadcrumbs that led to this log.
   */
  breadcrumbs: BreadcrumbModel[] = [];

  /**
   * This is an object that is data that you want to "highlights" and show as logs. Select and be careful about what
   * you choose to highlight to avoid showing to many useless things.
   */
  highlights: LogHighlights = {};

  /**
   * The model that represents a log
   * @param severity The log severity.
   * @param message The actual log message that needs to be outputted.
   */
  constructor(public severity: SeverityEnum, public message: string) {
  }

}
