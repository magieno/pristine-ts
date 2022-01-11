import {SeverityEnum} from "../enums/severity.enum";

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
  kernelInstantiationId: string;

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
   * The actual log message that needs to be outputted.
   */
  message: string;

  /**
   * Any extras that need to be outputted along with the message.
   */
  extra: any;

  /**
   * The log severity.
   */
  severity: SeverityEnum
}
