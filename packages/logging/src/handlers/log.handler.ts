import {container, DependencyContainer, inject, injectable, injectAll} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {WriterInterface} from "../interfaces/writer.interface";

@injectable()
export class LogHandler {
  private stackedLogs: LogModel[] = [];

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") private readonly numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @injectAll("writer") private readonly writers: WriterInterface[]) {
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

  public addStackedLog(log: LogModel) {
    // Push the log at the end of the array
    this.stackedLogs.push(log);

    // If the stacked logs is already at the maximum number of logs, we delete the first log.
    if (this.stackedLogs.length >= this.numberOfStackedLogs) {
      this.stackedLogs.shift();
    }
  }

  public async outputStackedLogs() {
    for(const log of this.stackedLogs){
      await this.captureLog(log);
    }

    this.clearStackedLogs();
  }

  public clearStackedLogs() {
    this.stackedLogs = [];
  }

  public log(message: string, severity: SeverityEnum = SeverityEnum.Error, extra?: any, identity?: any): void {
    const log = new LogModel();
    log.extra = extra;
    log.severity = severity;
    log.identity = identity;
    log.message = message;

    this.captureLog(log);
  }

  public captureLog(log: LogModel): void {
    for(const writer of this.writers){
      writer.readableStream.push(log);
    }
  }
}
