import {inject, injectable} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import * as util from "util";
import {Utils} from "../utils/utils";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import format from "date-fns/format";


@tag(ServiceDefinitionTagEnum.Logger)
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
                     @inject("%pristine.logging.consoleLoggerActivated%") private readonly consoleLoggerActivated: boolean,
                     @inject("%pristine.logging.consoleLoggerOutputMode%") private readonly consoleLoggerOutputMode: OutputModeEnum,
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
    return this.consoleLoggerActivated;
  }

  private getSeverityText(logSeverity: SeverityEnum) {
    switch (logSeverity) {
      case SeverityEnum.Debug:
        return "DEBUG";

      case SeverityEnum.Info:
        return "INFO";

      case SeverityEnum.Warning:
        return "WARNING";

      case SeverityEnum.Error:
        return "ERROR";

      case SeverityEnum.Critical:
        return "CRITICAL";
    }
  }

  private outputLog(log: LogModel): string {
    switch (this.consoleLoggerOutputMode) {
      case OutputModeEnum.Json:
        switch (log.severity) {
          case SeverityEnum.Debug:
            return JSON.stringify(Utils.truncate(log,  this.logDebugDepthConfiguration));

          case SeverityEnum.Info:
            return JSON.stringify(Utils.truncate(log,  this.logInfoDepthConfiguration));

          case SeverityEnum.Warning:
            return JSON.stringify(Utils.truncate(log,  this.logWarningDepthConfiguration));

          case SeverityEnum.Error:
            return JSON.stringify(Utils.truncate(log,  this.logErrorDepthConfiguration));

          case SeverityEnum.Critical:
            return JSON.stringify(Utils.truncate(log,  this.logCriticalDepthConfiguration));
        }
      case OutputModeEnum.Simple:
        return format(log.date, "yyyy-MM-dd HH:mm:ss") + " - " + " [" + this.getSeverityText(log.severity) + "] - " + log.message + " - " + JSON.stringify(Utils.truncate(log.extra, 2));
    }
  }

  private log(log: LogModel): void {
    const outputLog = this.outputLog(log);

    switch (log.severity) {
      case SeverityEnum.Debug:
        console.debug(outputLog);
        break;

      case SeverityEnum.Info:
        console.info(outputLog);
        break;

      case SeverityEnum.Warning:
        console.warn(outputLog);
        break;

      case SeverityEnum.Error:
        console.error(outputLog);
        break;

      case SeverityEnum.Critical:
        console.error(outputLog);
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
