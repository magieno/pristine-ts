import "reflect-metadata"
import {injectable, injectAll, singleton, inject} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {ServiceDefinitionTagEnum, tag, TracingContext, InternalContainerParameterEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "../interfaces/log-handler.interface";

@tag("LogHandlerInterface")
@injectable()
export class LogHandler implements LogHandlerInterface {

  public constructor(@injectAll(ServiceDefinitionTagEnum.Logger) private readonly loggers: LoggerInterface[],
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

    for(const writer of this.loggers){
      if(writer.isActive()) {
        writer.readableStream.push(log);
      }
    }
  }
}
