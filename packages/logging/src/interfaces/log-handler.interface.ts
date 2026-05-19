import {LogData} from "../types/log-data.type";

/**
 * This interface defines what functions should be implemented by a LogHandler.
 * This interface is what should be injected when you want a LogHandler so that mocking can be done easier.
 */
export interface LogHandlerInterface {
  /**
   * Logs the message if the severity is set to critical or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  critical(message: string, data?: LogData): void;

  /**
   * Logs the message if the severity is set to error or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  error(message: string, data?: LogData): void;

  /**
   * Logs the message if the severity is set to warning or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  warning(message: string, data?: LogData): void;

  /**
   * Logs the message if the severity is set to notice or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  notice(message: string, data?: LogData): void;

  /**
   * Logs the message if the severity is set to info or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  info(message: string, data?: LogData): void;

  /**
   * Logs the message at Success severity (rank 2, between Info and Notice). Visible at
   * the default Info threshold; hidden when the threshold is set to Warning or above.
   * Use for positive completion events (build complete, server started, sync finished).
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  success(message: string, data?: LogData): void;

  /**
   * Logs the message if the severity is set to debug or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  debug(message: string, data?: LogData): void;

  /**
   * This is called when the log handler is to terminate
   */
  terminate(): void;
}