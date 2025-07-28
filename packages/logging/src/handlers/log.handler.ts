import "reflect-metadata"
import {inject, injectable, injectAll, Lifecycle, scoped} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {
  InternalContainerParameterEnum,
  moduleScoped,
  ServiceDefinitionTagEnum,
  tag,
  TracingContext
} from "@pristine-ts/common";
import {LogHandlerInterface} from "../interfaces/log-handler.interface";
import {BreadcrumbHandlerInterface} from "../interfaces/breadcrumb-handler.interface";
import {Utils} from "../utils/utils";
import {LoggingModuleKeyname} from "../logging.module";
import {LogData} from "../types/log-data.type";

/**
 * The LogHandler to use when we want to output some logs.
 * This handler makes sure that only the right level of logs are outputted, stacks logs, and logs with different loggers.
 * It is registered with the tag LogHandlerInterface so that it can be injected as a LogHandlerInterface to facilitate mocking.
 */
@moduleScoped(LoggingModuleKeyname)
@tag("LogHandlerInterface")
@injectable()
@scoped(Lifecycle.ContainerScoped)
export class LogHandler implements LogHandlerInterface {

  /**
   * The LogHandler to use when we want to output some logs.
   * @param loggers The loggers to use to output the logs. All services with the tag ServiceDefinitionTagEnum.Logger will be automatically injected here.
   * @param logSeverityLevelConfiguration The severity from which to start logging the logs.
   * @param activateDiagnostics Whether or not the outputted logs should contain the diagnostic part. This is an intensive process and can dramatically reduce the performance of the code.
   * @param kernelInstantiationId The id of instantiation of the kernel.
   * @param breadcrumbHandler The Breadcrumb handler to get all the latest breadcrumbs.
   * @param tracingContext The context of the tracing.
   */
  public constructor(@injectAll(ServiceDefinitionTagEnum.Logger) private readonly loggers: LoggerInterface[],
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.activateDiagnostics%") private readonly activateDiagnostics: boolean,
                     @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly kernelInstantiationId: string,
                     @inject("BreadcrumbHandlerInterface") private readonly breadcrumbHandler: BreadcrumbHandlerInterface,
                     private readonly tracingContext: TracingContext) {
  }

  /**
   * This method terminates the loggers.
   */
  terminate(): void {
    this.loggers.forEach((logger: LoggerInterface) => {
      logger.terminate();
    })
  }

  /**
   * Logs the message if the severity is set to critical or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public critical(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Critical, data);
  }

  /**
   * Logs the message if the severity is set to error or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public error(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Error, data);
  }

  /**
   * Logs the message if the severity is set to warning or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public warning(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Warning, data);
  }

  /**
   * Logs the message if the severity is set to info or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public info(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Info, data);
  }

  /**
   * Logs the message if the severity is set to debug or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public debug(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Debug, data);
  }

  /**
   * Logs the message based on the severity.
   * @param message The message to log.
   * @param severity The minimum severity to log.
   * @param data The data being passed to the log
   */
  private log(message: string, severity: SeverityEnum, data?: LogData): void {
    const log = new LogModel(severity, message);
    log.kernelInstantiationId = this.kernelInstantiationId;
    log.traceId = this.tracingContext.traceId;
    log.date = new Date();

    // Handle the data parameter to extract highlights and extra information.
    if (data) {
      // Check if data is in the structured format { highlights, extra }
      if (typeof data === 'object' && data !== null && !Array.isArray(data) && (data.hasOwnProperty('highlights') || data.hasOwnProperty('extra'))) {
        log.highlights = data.highlights ?? {};
        log.extra = data.extra;
        log.eventId = data.eventId;
      } else {
        // Otherwise, treat the entire data object as 'extra'
        log.extra = data;
      }

      if (data.breadcrumb) {
        this.breadcrumbHandler.add(data.eventId, data.breadcrumb);
      }

      if (data.eventId) {
        log.breadcrumbs = this.breadcrumbHandler.breadcrumbs[data.eventId];
      }

      if (data.outputHints) {
        log.outputHints = data.outputHints;
      }

      if (data.eventGroupId) {
        log.eventGroupId = data.eventGroupId;
      }
    }


    // If the activateDiagnostics configuration is set to true, we will include additional information into a __diagnostics path into extra.
    // This is an intensive process so be careful, it will dramatically slow down your calls.
    if (this.activateDiagnostics) {
      const diagnostics = Utils.getDiagnostics(new Error());

      // Properly define which last stack trace is actually the one we want to report. In this case, it's the stack trace
      // Just before any entries in LogHandler.
      for (const stackTrace of diagnostics.stackTrace) {
        if (stackTrace.className === undefined || stackTrace.className === "" || stackTrace.className.startsWith("LogHandler") || stackTrace.className.startsWith("Array")) {
          continue;
        }

        diagnostics.lastStackTrace = stackTrace;
        break;
      }

      // Ensure log.extra is an object before adding diagnostics
      if (typeof log.extra !== 'object' || log.extra === null) {
        log.extra = {originalData: log.extra};
      }

      log.extra["__diagnostics"] = diagnostics;
    }

    // Log in every logger that is activated.
    for (const logger of this.loggers) {
      if (logger.isActive()) {
        logger.readableStream?.push(log);
      }
    }
  }
}