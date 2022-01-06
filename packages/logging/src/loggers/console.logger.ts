import {inject, injectable, singleton } from "tsyringe";
import {SeverityEnum} from "../enums/severity.enum";
import {LogModel} from "../models/log.model";
import {LoggerInterface} from "../interfaces/logger.interface";
import {Readable} from "stream";
import * as util from "util";
import {Utils} from "../utils/utils";
import {CommonModuleKeyname, moduleScoped, ServiceDefinitionTagEnum, tag} from "@pristine-ts/common";
import {OutputModeEnum} from "../enums/output-mode.enum";
import format from "date-fns/format";
import {LoggingModuleKeyname} from "../logging.module.keyname";
import {BaseLogger} from "./base.logger";

@moduleScoped(LoggingModuleKeyname)
@singleton()
@tag(ServiceDefinitionTagEnum.Logger)
@injectable()
export class ConsoleLogger extends BaseLogger implements LoggerInterface {
  public readableStream: Readable;

  public constructor(@inject("%pristine.logging.numberOfStackedLogs%") numberOfStackedLogs: number,
                     @inject("%pristine.logging.logSeverityLevelConfiguration%") logSeverityLevelConfiguration: number,
                     @inject("%pristine.logging.logDebugDepthConfiguration%") logDebugDepthConfiguration: number,
                     @inject("%pristine.logging.logInfoDepthConfiguration%") logInfoDepthConfiguration: number,
                     @inject("%pristine.logging.logWarningDepthConfiguration%") logWarningDepthConfiguration: number,
                     @inject("%pristine.logging.logErrorDepthConfiguration%") logErrorDepthConfiguration: number,
                     @inject("%pristine.logging.logCriticalDepthConfiguration%") logCriticalDepthConfiguration: number,
                     @inject("%pristine.logging.consoleLoggerActivated%") isActive: boolean,
                     @inject("%pristine.logging.consoleLoggerOutputMode%") outputMode: OutputModeEnum,
                     ) {
    super(numberOfStackedLogs,
        logSeverityLevelConfiguration,
        logDebugDepthConfiguration,
        logInfoDepthConfiguration,
        logWarningDepthConfiguration,
        logErrorDepthConfiguration,
        logCriticalDepthConfiguration,
        isActive,
        outputMode);

    this.initialize();
  }
  protected initialize(){
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

  protected log(log: LogModel): void {
    const outputLog = this.getFormattedOutputLog(log);

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
}
