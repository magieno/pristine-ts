import {inject, injectable, singleton } from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import * as util from "util";
import {Utils} from "../utils/utils";
import {CommonModuleKeyname, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import format from "date-fns/format";

@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class ConsoleLogger implements LoggerInterface {
  public readableStream: Readable;
  private stackedLogs: {[key: string]: LogModel[]} = {};

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

  public outputLog(log: LogModel): string {
    switch (log.severity) {
      case SeverityEnum.Debug:
        return Utils.outputLog(log, this.consoleLoggerOutputMode, this.logDebugDepthConfiguration);

      case SeverityEnum.Info:
        return Utils.outputLog(log, this.consoleLoggerOutputMode, this.logInfoDepthConfiguration);

      case SeverityEnum.Warning:
        return Utils.outputLog(log, this.consoleLoggerOutputMode, this.logWarningDepthConfiguration)

      case SeverityEnum.Error:
        return Utils.outputLog(log, this.consoleLoggerOutputMode, this.logErrorDepthConfiguration)

      case SeverityEnum.Critical:
        return Utils.outputLog(log, this.consoleLoggerOutputMode, this.logCriticalDepthConfiguration)
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
    this.setupStackedLogsArrayIfRequired(log.traceId);

    if (log.severity < this.logSeverityLevelConfiguration) {
      // We still add a log to the stack to ensure that when there's an error, we log everything.
      this.addStackedLog(log);

      return;
    }

    //todo do we really want to always print the stacked logs ?
    this.outputStackedLogs();
    this.log(log);
  }

  private setupStackedLogsArrayIfRequired(traceId?: string) {
    if(this.stackedLogs.hasOwnProperty(CommonModuleKeyname) === false) {
      this.stackedLogs[CommonModuleKeyname] = [];
    }

    if(traceId && this.stackedLogs.hasOwnProperty(traceId) === false) {
      this.stackedLogs[traceId] = [];
    }
  }

  private addStackedLog(log: LogModel) {
    const stackedLogsKey = log.traceId ?? CommonModuleKeyname;

    // Push the log at the end of the array
    this.stackedLogs[stackedLogsKey].push(log);

    // If the stacked logs is already at the maximum number of logs, we delete the first log.
    if (this.stackedLogs[stackedLogsKey].length >= this.numberOfStackedLogs) {
      this.stackedLogs[stackedLogsKey].shift();
    }
  }

  private outputStackedLogs(traceId?: string) {
    for(const log of this.stackedLogs[CommonModuleKeyname]) {
      this.log(log);
    }

    if(traceId === undefined || this.stackedLogs.hasOwnProperty(traceId) === false) {
      return;
    }

    for(const log of this.stackedLogs[traceId]){
      this.log(log);
    }

    this.clearStackedLogs(traceId);
  }

  private clearStackedLogs(traceId?: string) {
    this.stackedLogs[CommonModuleKeyname] = [];

    if(traceId === undefined || this.stackedLogs.hasOwnProperty(traceId) === false) {
      return;
    }

    this.stackedLogs[traceId] = [];
  }
}
