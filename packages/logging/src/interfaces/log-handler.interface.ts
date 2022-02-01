/**
 * This interface defines what functions should be implemented by a LogHandler.
 * This interface is what should be injected when you want a LogHandler so that mocking can be done easier.
 */
export interface LogHandlerInterface {
    /**
     * Logs the message if the severity is set to critical or above.
     * @param message The message to log.
     * @param extra The extra object to log.
     * @param module The module from where the log was created.
     */
    critical(message: string, extra?: any, module?: string): void;

    /**
     * Logs the message if the severity is set to critical or above.
     * @param message The message to log.
     * @param extra The extra object to log.
     * @param module The module from where the log was created.
     */
    error(message: string, extra?: any, module?: string): void;

    /**
     * Logs the message if the severity is set to critical or above.
     * @param message The message to log.
     * @param extra The extra object to log.
     * @param module The module from where the log was created.
     */
    warning(message: string, extra?: any, module?: string): void;

    /**
     * Logs the message if the severity is set to critical or above.
     * @param message The message to log.
     * @param extra The extra object to log.
     * @param module The module from where the log was created.
     */
    info(message: string, extra?: any, module?: string): void;

    /**
     * Logs the message if the severity is set to critical or above.
     * @param message The message to log.
     * @param extra The extra object to log.
     * @param module The module from where the log was created.
     */
    debug(message: string, extra?: any, module?: string): void;

    /**
     * This is called when the log handler is to terminate
     */
    terminate(): void;
}
