import {inject, injectable} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import * as util from "util";

@injectable()
export class ConsoleLogger implements LoggerInterface {
  public readableStream: Readable;
  private stackedLogs: LogModel[] = [];

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") private readonly numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") private readonly logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") private readonly logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") private readonly logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") private readonly logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") private readonly logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.consoleWriterActivated%") private readonly consoleWriterActivated: boolean,
                     ) {
    this.initialize();
  }

  private initialize(){
    if(this.isActive()) {
      this.readableStream = new Readable({
        objectMode: true,
        read(size: number) {
          return true;
        }
      });
      this.readableStream.on('data', chunk => {
        this.captureLog(chunk);
      });
    }
  }

  public isActive(): boolean {
    return this.consoleWriterActivated;
  }

  private log(log: LogModel): void {
    switch (log.severity) {
      case SeverityEnum.Debug:
        console.debug(log.message + " - Extra: " + util.inspect(log.extra, false, this.logDebugDepthConfiguration));
        break;

      case SeverityEnum.Info:
        console.info(log.message + " - Extra: " + util.inspect(log.extra, false, this.logInfoDepthConfiguration));
        break;

      case SeverityEnum.Warning:
        console.warn(log.message + " - Extra: " + util.inspect(log.extra, false, this.logWarningDepthConfiguration));
        break;

      case SeverityEnum.Error:
        console.error(log.message + " - Extra: " + util.inspect(log.extra, false, this.logErrorDepthConfiguration));
        break;

      case SeverityEnum.Critical:
        console.error(log.message + " - Extra: " + util.inspect(log.extra, false, this.logCriticalDepthConfiguration));
        break;
    }
  }

  private captureLog(log: LogModel): void {
    if (log.severity < this.logSeverityLevelConfiguration) {
      // We still add a log to the stack to ensure that when there's an error, we log everything.
      this.addStackedLog(log);

      return;
    }

    //todo do we really want to always print the stacked logs ?
    this.outputStackedLogs();
    this.log(log);
  }

  private addStackedLog(log: LogModel) {
    // Push the log at the end of the array
    this.stackedLogs.push(log);

    // If the stacked logs is already at the maximum number of logs, we delete the first log.
    if (this.stackedLogs.length >= this.numberOfStackedLogs) {
      this.stackedLogs.shift();
    }
  }

  private outputStackedLogs() {
    for(const log of this.stackedLogs){
      this.log(log);
    }

    this.clearStackedLogs();
  }

  private clearStackedLogs() {
    this.stackedLogs = [];
  }
}
