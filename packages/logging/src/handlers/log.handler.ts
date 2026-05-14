import "reflect-metadata"
import {inject, injectable, injectAll, Lifecycle, scoped} from "tsyringe";
import {LoggingConfigurationKeys} from "../logging.configuration-keys";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {EventContextManager, injectConfig, InternalContainerParameterEnum, moduleScoped, ServiceDefinitionTagEnum, tag, TracingContext} from "@pristine-ts/common";
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
                     @injectConfig(LoggingConfigurationKeys.LogSeverityLevelConfiguration) private readonly logSeverityLevelConfiguration: number,
                     @injectConfig(LoggingConfigurationKeys.ActivateDiagnostics) private readonly activateDiagnostics: boolean,
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
   * Logs the message if the severity is set to notive or above.
   * @param message The message to log.
   * @param data The data being passed to the log
   */
  public notice(message: string, data?: LogData): void {
    return this.log(message, SeverityEnum.Notice, data);
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
    // Resolve the trace id from the active EventContext first (the path forward), with a
    // fallback to the legacy `TracingContext` (the per-child-container service that was
    // the original mechanism). Code that goes through `TracingManager.startTracing` writes
    // both, so the common path works through either branch; the fallback exists for
    // pre-ALS code that sets `tracingContext.traceId` directly without involving the
    // manager. Once `TracingContext` is removed in a future major, this collapses to just
    // the EventContext read.
    log.traceId = EventContextManager.traceId() ?? this.tracingContext.traceId;
    log.date = new Date();

    // Resolve the eventId once. Explicit `data.eventId` always wins (callers that want
    // to log against a different event — e.g. a parent log line during fan-out — keep
    // their override). When the caller didn't pass one, fall back to the active
    // EventContext so we don't have to thread `eventId: request.id` through every call
    // site. Outside any EventContext (e.g. logs from boot, before the pipeline starts),
    // both are undefined and the field is omitted from the output — same as today.
    const resolvedEventId = data?.eventId ?? EventContextManager.eventId();

    // Handle the data parameter to extract highlights and extra information.
    if (data) {
      // Check if data is in the structured format { highlights, extra }
      if (typeof data === 'object' && data !== null && !Array.isArray(data) && (data.hasOwnProperty('highlights') || data.hasOwnProperty('extra') || data.hasOwnProperty('eventId'))) {
        log.highlights = data.highlights ?? {};
        log.extra = data.extra;
        log.eventId = resolvedEventId;
      } else {
        // Otherwise, treat the entire data object as 'extra'
        log.extra = data;
        log.eventId = resolvedEventId;
      }

      if (data.breadcrumb) {
        this.breadcrumbHandler.add(resolvedEventId, data.breadcrumb);
      }

      if (resolvedEventId) {
        log.breadcrumbs = this.breadcrumbHandler.breadcrumbs[resolvedEventId];
      }

      if (data.outputHints) {
        log.outputHints = data.outputHints;
      }

      if (data.eventGroupId) {
        log.eventGroupId = data.eventGroupId;
      }
    } else {
      // No `data` arg at all — still try to attach the eventId from the active context
      // so a bare `logHandler.info("...")` from within a request gets correlated.
      log.eventId = resolvedEventId;
      if (resolvedEventId) {
        log.breadcrumbs = this.breadcrumbHandler.breadcrumbs[resolvedEventId];
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

    // Log in every logger that is activated. Each logger's dispatch is isolated: a
    // throwing logger writes to stderr but does not propagate the error back to the
    // caller and does not prevent the other loggers from receiving the entry.
    //
    // Implementation note: we deliberately bypass `readableStream.push(log)` here.
    // Calling push() schedules the 'data' emission via Node's microtask queue
    // (processTicksAndRejections), which means a throwing 'data' listener escapes
    // as an uncaughtException — the synchronous try/catch we want around it cannot
    // catch what runs in a later tick. By invoking the data listeners directly we
    // keep execution in this tick, where try/catch actually works. Every existing
    // logger (BaseLogger and external implementations alike) does its work inside
    // a 'data' listener, so the observable behavior is identical.
    for (const logger of this.loggers) {
      if (logger.isActive() === false) {
        continue;
      }

      const stream = logger.readableStream;
      if (stream === undefined) {
        continue;
      }

      try {
        for (const listener of stream.listeners("data")) {
          (listener as (chunk: any) => void)(log);
        }
      } catch (error) {
        const name = (logger as any)?.constructor?.name ?? "UnknownLogger";
        const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        try {
          process.stderr.write(`[pristine][log-handler] logger '${name}' threw during dispatch: ${message}\n`);
        } catch {
          // Nothing useful left to do if stderr is unavailable.
        }
      }
    }
  }
}