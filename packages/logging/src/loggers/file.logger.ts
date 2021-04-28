import {inject, injectable} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable, Writable} from "stream";
import * as util from "util";
import {Utils} from "../utils/utils";
import {ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import fs from 'fs';

@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class FileLogger implements LoggerInterface {
  public readableStream: Readable;
  public writableStream: Writable;
  private stackedLogs: LogModel[] = [];

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") private readonly numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") private readonly logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") private readonly logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") private readonly logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") private readonly logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") private readonly logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") private readonly logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.fileLoggerActivated%") private readonly fileLoggerActivated: boolean,
                     @inject("%pristine.logging.filePath%") private readonly filePath: string,
                     @inject("%pristine.logging.fileLoggerPretty%") private readonly fileLoggerPretty: boolean,
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
      this.writableStream = fs.createWriteStream(this.filePath);
      this.readableStream.on('data', chunk => {
        this.captureLog(chunk);
      });
    }
  }

  public isActive(): boolean {
    return this.fileLoggerActivated;
  }

  private log(log: LogModel): void {
    switch (log.severity) {
      case SeverityEnum.Debug:
        this.writableStream.write(JSON.stringify(Utils.truncate(log, this.logDebugDepthConfiguration),null, this.fileLoggerPretty ? 2 : 0) + ";\n" );
        break;

      case SeverityEnum.Info:
        this.writableStream.write(JSON.stringify(Utils.truncate(log, this.logInfoDepthConfiguration),null, this.fileLoggerPretty ? 2 : 0)+ ";\n" );
        break;

      case SeverityEnum.Warning:
        this.writableStream.write(JSON.stringify(Utils.truncate(log, this.logWarningDepthConfiguration),null, this.fileLoggerPretty ? 2 : 0)+ ";\n" );
        break;

      case SeverityEnum.Error:
        this.writableStream.write(JSON.stringify(Utils.truncate(log, this.logErrorDepthConfiguration),null, this.fileLoggerPretty ? 2 : 0)+ ";\n" );
        break;

      case SeverityEnum.Critical:
        this.writableStream.write(JSON.stringify(Utils.truncate(log, this.logCriticalDepthConfiguration),null, this.fileLoggerPretty ? 2 : 0)+ ";\n" );
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
