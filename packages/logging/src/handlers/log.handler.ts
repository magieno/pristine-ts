import {injectable, injectAll} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";
import {LogHandlerInterface} from "../interfaces/log-handler.interface";

@injectable()
export class LogHandler implements LogHandlerInterface {

  public constructor(@injectAll(ServiceDefinitionTagEnum.Logger) private readonly loggers: LoggerInterface[]) {
  }

  public error(message: string, extra?: any): void {
    return this.log(message, SeverityEnum.Error, extra);
  }

  public critical(message: string, extra?: any): void {
    return this.log(message, SeverityEnum.Critical, extra);
  }

  public debug(message: string, extra?: any): void {
    return this.log(message, SeverityEnum.Debug, extra);
  }

  public info(message: string, extra?: any): void {
    return this.log(message, SeverityEnum.Info, extra);
  }

  public warning(message: string, extra?: any): void {
    return this.log(message, SeverityEnum.Warning, extra);
  }

  public log(message: string, severity: SeverityEnum = SeverityEnum.Error, extra?: any): void {
    const log = new LogModel();
    log.extra = extra;
    log.severity = severity;
    log.message = message;

    for(const writer of this.loggers){
      if(writer.isActive()) {
        writer.readableStream.push(log);
      }
    }
  }
}
