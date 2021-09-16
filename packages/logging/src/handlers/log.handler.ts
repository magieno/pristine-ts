import "reflect-metadata"
import {injectable, injectAll, singleton, inject} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {ServiceDefinitionTagEnum, tag, TracingContext, InternalContainerParameterEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "../interfaces/log-handler.interface";
import {Utils} from "../utils/utils";

@tag("LogHandlerInterface")
@injectable()
export class LogHandler implements LogHandlerInterface {

  public constructor(@injectAll(ServiceDefinitionTagEnum.Logger) private readonly loggers: LoggerInterface[],
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject(InternalContainerParameterEnum.KernelInstantiationId) private readonly kernelInstantiationId: string,
                     private readonly tracingContext: TracingContext) {
  }

  public error(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Error, extra, module);
  }

  public critical(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Critical, extra, module);
  }

  public debug(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Debug, extra, module);
  }

  public info(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Info, extra, module);
  }

  public warning(message: string, extra?: any, module: string = "application"): void {
    return this.log(message, SeverityEnum.Warning, extra, module);
  }

  private log(message: string, severity: SeverityEnum = SeverityEnum.Error, extra?: any, module: string = "application"): void {
    const log = new LogModel();
    log.traceId = this.tracingContext.traceId;
    log.kernelInstantiationId = this.kernelInstantiationId;
    log.extra = extra;
    log.severity = severity;
    log.message = message;
    log.module = module;
    log.date = new Date();

    // If the logSeveritylevel configuration is set to debug, we will include additional information into a __diagnostics path into extra.
    // This is an intensive process and will only be available when in Debug
    if(this.logSeverityLevelConfiguration === SeverityEnum.Debug) {
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

    for(const writer of this.loggers){
      if(writer.isActive()) {
        writer.readableStream.push(log);
      }
    }
  }
}
