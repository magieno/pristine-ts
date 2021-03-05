import {injectable, injectAll} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {WriterInterface} from "../interfaces/writer.interface";
import {ServiceDefinitionTagEnum} from "@pristine-ts/common";

@injectable()
export class LogHandler {

  public constructor(@injectAll(ServiceDefinitionTagEnum.Writer) private readonly writers: WriterInterface[]) {
  }

  public error(message: string, extra?: any, identity?: any): void {
    return this.log(message, SeverityEnum.Error, extra, identity);
  }

  public critical(message: string, extra?: any, identity?: any): void {
    return this.log(message, SeverityEnum.Critical, extra, identity);
  }

  public debug(message: string, extra?: any, identity?: any): void {
    return this.log(message, SeverityEnum.Debug, extra, identity);
  }

  public info(message: string, extra?: any, identity?: any): void {
    return this.log(message, SeverityEnum.Info, extra, identity);
  }

  public warning(message: string, extra?: any, identity?: any): void {
    return this.log(message, SeverityEnum.Warning, extra, identity);
  }

  public log(message: string, severity: SeverityEnum = SeverityEnum.Error, extra?: any, identity?: any): void {
    const log = new LogModel();
    log.extra = extra;
    log.severity = severity;
    log.identity = identity;
    log.message = message;

    for(const writer of this.writers){
      if(writer.isActive()) {
        writer.readableStream.push(log);
      }
    }
  }
}
