import "reflect-metadata"
import {injectable, injectAll, singleton, inject} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {
  ServiceDefinitionTagEnum,
  tag,
  TracingContext,
  InternalContainerParameterEnum,
  moduleScoped
} from "@pristine-ts/common";
import {LogHandlerInterface} from "../interfaces/log-handler.interface";
import {Utils} from "../utils/utils";
import {LoggingModule, LoggingModuleKeyname} from "../logging.module";

/**
 * The LogHandler to use when we want to output some logs.
 * This handler makes sure that only the right level of logs are outputted, stacks logs, and logs with different loggers.
 * It is registered with the tag LogHandlerInterface so that it can be injected as a LogHandlerInterface to facilitate mocking.
 */
@tag("LogHandlerInterface")
@moduleScoped(LoggingModuleKeyname)
@injectable()
export class LogHandler implements LogHandlerInterface {

  /**
   * The LogHandler to use when we want to output some logs.
   * @param loggers The loggers to use to output the logs. All services with the tag ServiceDefinitionTagEnum.Logger will be automatically injected here.
   * @param logSeverityLevelConfiguration The severity from which to start logging the logs.
   * @param activateDiagnostics Whether or not the outputted logs should contain the diagnostic part. This is an intensive process and can dramatically reduce the performance of the code.
   * @param kernelInstantiationId The id of instantiation of the kernel.
   * @param tracingContext The context of the tracing.
   */
  public constructor(@injectAll(ServiceDefinitionTagEnum.Logger) private readonly loggers: LoggerInterface[],
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.activateDiagnostics%") private readonly activateDiagnostics: boolean,
                     @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly kernelInstantiationId: string,
                     private readonly tracingContext: TracingContext) {
  }

  /**
   * This method terminates the loggers.
   */
  terminate(): void {
        this.loggers.forEach( (logger: LoggerInterface) => {
          logger.terminate();
        })
    }

  /**
   * Logs the message if the severity is set to critical or above.
   * This function is wrapper function for the log method with the proper severity to make it cleaner when using it in the code.
   * @param message The message to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  public critical(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Critical, extra, module);
  }

  /**
   * Logs the message if the severity is set to error or above.
   * This function is wrapper function for the log method with the proper severity to make it cleaner when using it in the code.
   * @param message The message to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  public error(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Error, extra, module);
  }

  /**
   * Logs the message if the severity is set to warning or above.
   * This function is wrapper function for the log method with the proper severity to make it cleaner when using it in the code.
   * @param message The message to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  public warning(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Warning, extra, module);
  }

  /**
   * Logs the message if the severity is set to info or above.
   * This function is wrapper function for the log method with the proper severity to make it cleaner when using it in the code.
   * @param message The message to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  public info(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Info, extra, module);
  }

  /**
   * Logs the message if the severity is set to debug or above.
   * This function is wrapper function for the log method with the proper severity to make it cleaner when using it in the code.
   * @param message The message to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  public debug(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Debug, extra, module);
  }

  /**
   * Logs the message based on the severity.
   * @param message The message to log.
   * @param severity The minimum severity to log.
   * @param extra The extra object to log.
   * @param module The module from where the log was created.
   */
  private log(message: string, severity: SeverityEnum = SeverityEnum.Error, extra?: any, module: string = "application"): void {
    const log = new LogModel(severity, message);
    log.kernelInstantiationId = this.kernelInstantiationId;
    log.traceId = this.tracingContext.traceId;
    log.extra = extra;
    log.module = module;
    log.date = new Date();

    // If the activateDiagnostics configuration is set to true, we will include additional information into a __diagnostics path into extra.
    // This is an intensive process so be careful, it will dramatically slow down your calls.
    if(this.activateDiagnostics) {
      const diagnostics = Utils.getDiagnostics(new Error());

      // Properly define which last stack trace is actually the one we want to report. In this case, it's the stack trace
      // Just before any entries in LogHandler.
      for (const stackTrace of diagnostics.stackTrace) {
        if(stackTrace.className === undefined || stackTrace.className === "" || stackTrace.className.startsWith("LogHandler") || stackTrace.className.startsWith("Array")) {
          continue;
        }

        diagnostics.lastStackTrace = stackTrace;
        break;
      }

      log.extra["__diagnostics"] = diagnostics;
    }

    // Log in every logger that is activated.
    for(const logger of this.loggers){
      if(logger.isActive()) {
        logger.readableStream?.push(log);
      }
    }
  }
}
