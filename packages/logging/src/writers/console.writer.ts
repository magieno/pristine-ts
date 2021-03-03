import {container, DependencyContainer, inject, injectable, singleton} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {WriterInterface} from "../interfaces/writer.interface";
import {Readable, Writable} from "stream";
import * as util from "util";

@injectable()
export class ConsoleWriter implements WriterInterface {
  public readableStream: Readable;
  public writableStream: Writable;

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") private readonly numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") private readonly logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") private readonly logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") private readonly logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") private readonly logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalLevelConfiguration%") private readonly logCriticalLevelConfiguration: number,
                     ) {
    this.readableStream = new Readable({objectMode: true});
    this.writableStream = new Writable({objectMode: true});
    this.readableStream.on('data', chunk => {
      this.log(chunk);
    });
  }

  public log(log: LogModel): void {
    switch (log.severity) {
      case SeverityEnum.Debug:
        console.debug(log.message + " - Extra: " + util.inspect(log.extra, false, this.logDebugDepthConfiguration));
        break;

      case SeverityEnum.Info:
        console.log(log.message + " - Extra: " + util.inspect(log.extra, false, this.logInfoDepthConfiguration));
        break;

      case SeverityEnum.Warning:
        console.warn(log.message + " - Extra: " + util.inspect(log.extra, false, this.logWarningDepthConfiguration));
        break;

      case SeverityEnum.Error:
        console.error(log.message + " - Extra: " + util.inspect(log.extra, false, this.logErrorDepthConfiguration));
        break;

      case SeverityEnum.Critical:
        console.error(log.message + " - Extra: " + util.inspect(log.extra, false, this.logCriticalLevelConfiguration));
        break;
    }
  }
}
