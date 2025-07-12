import {LogHighlights} from "../types/log-highlights.type";

/**
 * This interface defines what functions should be implemented by a LogHandler.
 * This interface is what should be injected when you want a LogHandler so that mocking can be done easier.
 */
export interface LogHandlerInterface {
  /**
   * Logs the message if the severity is set to critical or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   * @param breadcrumb The breadcrumb passed to the log to identify where the error originated from.
   */
  critical(message: string, data?: {highlights?: LogHighlights, extra?:any} | any, breadcrumb?: string): void;

  /**
   * Logs the message if the severity is set to error or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   * @param breadcrumb The breadcrumb passed to the log to identify where the error originated from.
   */
  error(message: string, data?: {highlights?: LogHighlights, extra?:any} | any, breadcrumb?: string): void;

  /**
   * Logs the message if the severity is set to warning or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   * @param breadcrumb The breadcrumb passed to the log to identify where the error originated from.
   */
  warning(message: string, data?: {highlights?: LogHighlights, extra?:any} | any, breadcrumb?: string): void;

  /**
   * Logs the message if the severity is set to info or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   * @param breadcrumb The breadcrumb passed to the log to identify where the error originated from.
   */
  info(message: string, data?: {highlights?: LogHighlights, extra?:any} | any, breadcrumb?: string): void;

  /**
   * Logs the message if the severity is set to debug or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   * @param breadcrumb The breadcrumb passed to the log to identify where the error originated from.
   */
  debug(message: string, data?: {highlights?: LogHighlights, extra?:any} | any, breadcrumb?: string): void;

  /**
   * This is called when the log handler is to terminate
   */
  terminate(): void;
}