import {inject, injectable, singleton} from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable, Writable} from "stream";
import {moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import fs from 'fs';
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {OutputModeEnum} from "../enums/output-mode.enum";
import {BaseLogger} from "./base.logger";

@moduleScoped(LoggingModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class FileLogger extends BaseLogger implements LoggerInterface {
  public readableStream: Readable;
  public writableStream: Writable;

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.fileLoggerActivated%") isActive: boolean,
                     @inject("%pristine.logging.fileLoggerOutputMode%") outputMode: OutputModeEnum,
                     @inject("%pristine.logging.fileLoggerPretty%")  fileLoggerPretty: boolean,
                     @inject("%pristine.logging.filePath%") private readonly filePath: string,
                     ) {
    super(numberOfStackedLogs,
        logSeverityLevelConfiguration,
        logDebugDepthConfiguration,
        logInfoDepthConfiguration,
        logWarningDepthConfiguration,
        logErrorDepthConfiguration,
        logCriticalDepthConfiguration, 
        isActive, 
        outputMode, 
        fileLoggerPretty ? 2 : 0);

    this.initialize();
  }

  protected initialize() {
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

  protected log(log: LogModel): void {
    const outputLog = this.outputLog(log) + ";\n";

    switch (log.severity) {
      case SeverityEnum.Debug:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Info:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Warning:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Error:
        this.writableStream.write(outputLog);
        break;

      case SeverityEnum.Critical:
        this.writableStream.write(outputLog);
        break;
    }
  }
}
